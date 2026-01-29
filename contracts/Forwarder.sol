// SPDX-License-Identifier: MIT
pragma solidity ^^0.8.25;

/*
RaiseFunds (Base-only) Donation System
=====================================

GOALS
- Accept ETH + native USDC on Base.
- Users donate through Forwarder.
- "Campaign wallet" is a RecipientVault contract:
    - Rejects ETH sent directly by users (only Forwarder can send).
    - Rejects donations after endTime (enforced in BOTH Forwarder + Vault).
- Funds do NOT sit in contracts long-term:
    - ETH is forwarded immediately to campaign owner EOA.
    - USDC is forwarded immediately via flushUSDC() in same tx.
- No refunds.
- No NFT minting (you will build NFT contract later).

IMPORTANT REALITY
- ETH can be forced into any contract via selfdestruct. This bypasses receive() checks.
  We include a sweep function so the campaign owner can recover forced ETH after endTime.
  Your "official donation accounting" should use Forwarder events/counters, NOT vault balances.

NETWORK CONSTANTS
- Base mainnet USDC (native Circle USDC): 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
*/

interface IERC20 {
    function balanceOf(address a) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

library SafeERC20 {
    function safeTransferFrom(IERC20 token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transferFrom.selector, from, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "SAFE_ERC20_TRANSFER_FROM_FAILED");
    }

    function safeTransfer(IERC20 token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transfer.selector, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "SAFE_ERC20_TRANSFER_FAILED");
    }
}

library Address {
    function sendValue(address payable to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "SEND_VALUE_FAILED");
    }
}

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        require(_status != _ENTERED, "REENTRANCY");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

abstract contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        require(initialOwner != address(0), "OWNER_ZERO");
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "OWNER_ZERO");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

/**
 * @notice Per-campaign "wallet" contract.
 * Enforces:
 *  - ETH: only accept from Forwarder and only before endTime, then forwards to campaign owner EOA immediately.
 *  - USDC: Forwarder transfers USDC in, then calls flushUSDC() to forward immediately to owner EOA.
 */
contract RecipientVault {
    using SafeERC20 for IERC20;
    using Address for address payable;

    address public immutable forwarder;
    address public immutable campaignOwner;
    uint64  public immutable endTime;
    IERC20  public immutable usdc;

    error NotForwarder();
    error Ended();
    error NotCampaignOwner();

    constructor(address _forwarder, address _campaignOwner, uint64 _endTime, address _usdc) {
        require(_forwarder != address(0), "FORWARDER_ZERO");
        require(_campaignOwner != address(0), "CAMPAIGN_OWNER_ZERO");
        require(_usdc != address(0), "USDC_ZERO");
        forwarder = _forwarder;
        campaignOwner = _campaignOwner;
        endTime = _endTime;
        usdc = IERC20(_usdc);
    }

    modifier onlyForwarder() {
        if (msg.sender != forwarder) revert NotForwarder();
        _;
    }

    modifier beforeEnd() {
        if (block.timestamp >= endTime) revert Ended();
        _;
    }

    /// @notice Accept ETH only from Forwarder and only before endTime; forward immediately.
    receive() external payable onlyForwarder beforeEnd {
        payable(campaignOwner).sendValue(msg.value);
    }

    /// @notice Forward any USDC held by this vault to the campaign owner. Called by Forwarder in same tx.
    function flushUSDC() external onlyForwarder beforeEnd {
        uint256 bal = usdc.balanceOf(address(this));
        if (bal > 0) usdc.safeTransfer(campaignOwner, bal);
    }

    /**
     * @notice Recover forced ETH (e.g., via selfdestruct) after campaign end.
     * Not part of "official donations". This prevents ETH getting stuck permanently.
     * Callable only by campaign owner.
     */
    function sweepForcedETH() external {
        if (msg.sender != campaignOwner) revert NotCampaignOwner();
        require(block.timestamp >= endTime, "NOT_ENDED");
        uint256 bal = address(this).balance;
        if (bal > 0) payable(campaignOwner).sendValue(bal);
    }

    /**
     * @notice Recover any USDC that might be stuck after endTime (e.g., someone transferred USDC directly to vault).
     * Callable only by campaign owner, only after endTime.
     */
    function sweepStuckUSDC() external {
        if (msg.sender != campaignOwner) revert NotCampaignOwner();
        require(block.timestamp >= endTime, "NOT_ENDED");
        uint256 bal = usdc.balanceOf(address(this));
        if (bal > 0) usdc.safeTransfer(campaignOwner, bal);
    }
}

/**
 * @notice Single Forwarder for all campaigns.
 * - Creates campaigns (deploys vault per campaign).
 * - Accepts donations in ETH and USDC.
 * - Updates onchain totals and emits events.
 * - Forwards funds to the vault; vault forwards to owner immediately.
 */
contract Forwarder is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Base mainnet native USDC (Circle)
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    struct Campaign {
        address owner;        // campaign creator EOA (receives funds)
        address vault;        // RecipientVault contract (campaign "wallet")
        uint64  endTime;      // fundraising end time
        bool    active;       // allows early close
        string  metadataURI;  // IPFS metadata pointer
        uint256 raisedETH;    // official ETH total through contract
        uint256 raisedUSDC;   // official USDC total through contract
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed campaignOwner,
        address indexed vault,
        uint64 endTime,
        string metadataURI
    );
    event CampaignClosed(uint256 indexed campaignId);
    event MetadataUpdated(uint256 indexed campaignId, string newMetadataURI);
    event Donated(uint256 indexed campaignId, address indexed donor, address indexed token, uint256 amount);

    error CampaignNotFound();
    error CampaignInactive();
    error CampaignEnded();
    error NoValue();
    error NoAmount();
    error NotAuthorized();
    error EndTimePast();
    error MetadataRequired();
    error OwnerZero();

    constructor(address protocolOwner) Ownable(protocolOwner) {}

    /// @dev Prevent accidental ETH sends to the Forwarder itself.
    receive() external payable { revert("DIRECT_ETH_NOT_ALLOWED"); }
    fallback() external payable { revert("DIRECT_CALL_NOT_ALLOWED"); }

    modifier campaignExists(uint256 campaignId) {
        if (campaigns[campaignId].owner == address(0)) revert CampaignNotFound();
        _;
    }

    function createCampaign(address campaignOwner, uint64 endTime, string calldata metadataURI)
        external
        returns (uint256 campaignId)
    {
        if (campaignOwner == address(0)) revert OwnerZero();
        if (endTime <= block.timestamp) revert EndTimePast();
        if (bytes(metadataURI).length == 0) revert MetadataRequired();

        // Deploy vault (simple). If you later want cheaper creation, switch to EIP-1167 clones.
        RecipientVault vault = new RecipientVault(address(this), campaignOwner, endTime, USDC);

        campaignId = ++campaignCount;
        campaigns[campaignId] = Campaign({
            owner: campaignOwner,
            vault: address(vault),
            endTime: endTime,
            active: true,
            metadataURI: metadataURI,
            raisedETH: 0,
            raisedUSDC: 0
        });

        emit CampaignCreated(campaignId, campaignOwner, address(vault), endTime, metadataURI);
    }

    /// @notice Optional early close. Can be called by campaign owner or protocol owner.
    function closeCampaign(uint256 campaignId) external campaignExists(campaignId) {
        Campaign storage c = campaigns[campaignId];
        if (msg.sender != c.owner && msg.sender != owner) revert NotAuthorized();
        if (!c.active) revert CampaignInactive();
        c.active = false;
        emit CampaignClosed(campaignId);
    }

    /// @notice Optional metadata update. Only campaign owner.
    function updateMetadata(uint256 campaignId, string calldata newMetadataURI) external campaignExists(campaignId) {
        Campaign storage c = campaigns[campaignId];
        if (msg.sender != c.owner) revert NotAuthorized();
        if (bytes(newMetadataURI).length == 0) revert MetadataRequired();
        c.metadataURI = newMetadataURI;
        emit MetadataUpdated(campaignId, newMetadataURI);
    }

    /// @notice Donate ETH through the official path; forwards ETH -> vault -> owner immediately.
    function donateETH(uint256 campaignId) external payable nonReentrant campaignExists(campaignId) {
        Campaign storage c = campaigns[campaignId];
        if (!c.active) revert CampaignInactive();
        if (block.timestamp >= c.endTime) revert CampaignEnded();
        if (msg.value == 0) revert NoValue();

        c.raisedETH += msg.value;
        emit Donated(campaignId, msg.sender, address(0), msg.value);

        // Send ETH to vault. Vault enforces onlyForwarder + beforeEnd and forwards to campaign owner.
        (bool ok, ) = c.vault.call{value: msg.value}("");
        require(ok, "ETH_TO_VAULT_FAILED");
    }

    /// @notice Donate USDC through the official path; transfers USDC -> vault -> owner immediately.
    /// User must approve Forwarder for `amount` USDC first.
    function donateUSDC(uint256 campaignId, uint256 amount) external nonReentrant campaignExists(campaignId) {
        Campaign storage c = campaigns[campaignId];
        if (!c.active) revert CampaignInactive();
        if (block.timestamp >= c.endTime) revert CampaignEnded();
        if (amount == 0) revert NoAmount();

        c.raisedUSDC += amount;
        emit Donated(campaignId, msg.sender, USDC, amount);

        // Move USDC into vault, then flush to owner in the same transaction.
        IERC20(USDC).safeTransferFrom(msg.sender, c.vault, amount);
        RecipientVault(c.vault).flushUSDC();
    }

    /// @notice Convenience getter returning the whole campaign.
    function getCampaign(uint256 campaignId) external view campaignExists(campaignId) returns (Campaign memory) {
        return campaigns[campaignId];
    }
}
