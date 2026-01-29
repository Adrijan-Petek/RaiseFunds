// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

error SafeERC20TransferFromFailed();
error SafeERC20TransferFailed();
error SendValueFailed();
error NotEnded();
error EthForwardFailed();
error Reentrancy();

error OwnerZero();
error NotOwner();
error ForwarderZero();
error UsdcZero();

error PauseNotRequested();
error PauseDelayNotPassed(uint256 readyAt);
error AlreadyPaused();
error NotPaused();
error EndTimeNotExtended();

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
        if (!(ok && (data.length == 0 || abi.decode(data, (bool))))) revert SafeERC20TransferFromFailed();
    }

    function safeTransfer(IERC20 token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transfer.selector, to, amount)
        );
        if (!(ok && (data.length == 0 || abi.decode(data, (bool))))) revert SafeERC20TransferFailed();
    }
}

library Address {
    function sendValue(address payable to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert SendValueFailed();
    }
}

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        if (_status == _ENTERED) revert Reentrancy();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

abstract contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert OwnerZero();
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert OwnerZero();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // Optional: I recommend NOT including renounceOwnership for protocol contracts.
    // If you keep it, understand you lose pause/unpause forever.
    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }
}

/**
 * @notice Per-campaign vault ("campaign wallet")
 * - ETH: only from Forwarder, forwarded immediately
 * - USDC: transferred in by Forwarder, flushed immediately
 * - Rejects after endTime
 * - endTime can be extended by Forwarder only (for extendCampaign feature)
 */
contract RecipientVault {
    using SafeERC20 for IERC20;
    using Address for address payable;

    address public immutable forwarder;
    address public immutable campaignOwner;
    uint64  public endTime;
    IERC20  public immutable usdc;

    event SweptETH(address indexed owner, uint256 amount);
    event SweptUSDC(address indexed owner, uint256 amount);
    event EndTimeUpdated(uint64 newEndTime);

    error NotForwarder();
    error NotCampaignOwner();
    error Ended();

    constructor(address _forwarder, address _campaignOwner, uint64 _endTime, address _usdc) {
        if (_forwarder == address(0)) revert ForwarderZero();
        if (_campaignOwner == address(0)) revert OwnerZero();
        if (_usdc == address(0)) revert UsdcZero();
        forwarder = _forwarder;
        campaignOwner = _campaignOwner;
        endTime = _endTime;
        usdc = IERC20(_usdc);
    }

    modifier onlyForwarder() {
        if (msg.sender != forwarder) revert NotForwarder();
        _;
    }

    receive() external payable onlyForwarder {
        if (block.timestamp >= endTime) revert Ended();
        payable(campaignOwner).sendValue(msg.value);
    }

    function flushUSDC() external onlyForwarder {
        if (block.timestamp >= endTime) revert Ended();
        uint256 bal = usdc.balanceOf(address(this));
        if (bal > 0) usdc.safeTransfer(campaignOwner, bal);
    }

    /// @notice Extend endTime (only extend, never shorten)
    function updateEndTime(uint64 newEndTime) external onlyForwarder {
        if (newEndTime <= endTime) revert EndTimeNotExtended();
        endTime = newEndTime;
        emit EndTimeUpdated(newEndTime);
    }

    function sweepForcedETH() external {
        if (msg.sender != campaignOwner) revert NotCampaignOwner();
        if (block.timestamp < endTime) revert NotEnded();

        uint256 bal = address(this).balance;
        if (bal > 0) {
            payable(campaignOwner).sendValue(bal);
            emit SweptETH(campaignOwner, bal);
        }
    }

    function sweepStuckUSDC() external {
        if (msg.sender != campaignOwner) revert NotCampaignOwner();
        if (block.timestamp < endTime) revert NotEnded();

        uint256 bal = usdc.balanceOf(address(this));
        if (bal > 0) {
            usdc.safeTransfer(campaignOwner, bal);
            emit SweptUSDC(campaignOwner, bal);
        }
    }
}

contract Forwarder is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Base mainnet native USDC (Circle)
    address public constant USDC = address(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);

    uint64 public constant MAX_DURATION = 365 days;

    // Pause timelock
    uint256 public constant PAUSE_DELAY = 1 days;

    struct Campaign {
        address owner;
        address vault;
        uint64  endTime;
        bool    active;
        string  metadataURI;
        uint256 raisedETH;
        uint256 raisedUSDC;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;

    event CampaignCreated(uint256 indexed campaignId, address indexed owner, address indexed vault, uint64 endTime, string metadataURI);
    event CampaignClosed(uint256 indexed campaignId);
    event CampaignExtended(uint256 indexed campaignId, uint64 newEndTime);
    event MetadataUpdated(uint256 indexed campaignId, string metadataURI);
    event Donated(uint256 indexed campaignId, address indexed donor, address indexed token, uint256 amount);

    event PauseRequested(uint256 requestedAt, uint256 readyAt);
    event PauseCancelled();
    event PausedSet(bool paused);

    error CampaignNotFound();
    error CampaignInactive();
    error CampaignEnded();
    error NotAuthorized();
    error NoValue();
    error NoAmount();
    error EndTimePast();
    error MetadataRequired();
    error DurationTooLong();
    error DirectEthNotAllowed();
    error DirectCallNotAllowed();
    error Paused();

    bool public paused;
    uint256 public pauseRequestedAt;

    constructor(address protocolOwner) Ownable(protocolOwner) {}

    receive() external payable { revert DirectEthNotAllowed(); }
    fallback() external payable { revert DirectCallNotAllowed(); }

    modifier campaignExists(uint256 id) {
        if (campaigns[id].owner == address(0)) revert CampaignNotFound();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    // --- pause controls (timelocked) ---
    function requestPause() external onlyOwner {
        if (paused) revert AlreadyPaused();
        pauseRequestedAt = block.timestamp;
        emit PauseRequested(block.timestamp, block.timestamp + PAUSE_DELAY);
    }

    function cancelPauseRequest() external onlyOwner {
        pauseRequestedAt = 0;
        emit PauseCancelled();
    }

    function pause() external onlyOwner {
        if (paused) revert AlreadyPaused();
        if (pauseRequestedAt == 0) revert PauseNotRequested();
        uint256 readyAt = pauseRequestedAt + PAUSE_DELAY;
        if (block.timestamp < readyAt) revert PauseDelayNotPassed(readyAt);

        paused = true;
        emit PausedSet(true);
        pauseRequestedAt = 0;
    }

    function unpause() external onlyOwner {
        if (!paused) revert NotPaused();
        paused = false;
        emit PausedSet(false);
        pauseRequestedAt = 0;
    }

    // --- convenience getters ---
    function usdcAddress() external pure returns (address) { return USDC; }

    /// @notice 0=NotFound, 1=Active, 2=Closed, 3=Ended
    function campaignStatus(uint256 id) external view returns (uint8) {
        Campaign storage c = campaigns[id];
        if (c.owner == address(0)) return 0;
        if (!c.active) return 2;
        if (block.timestamp >= c.endTime) return 3;
        return 1;
    }

    function raisedETH(uint256 id) external view campaignExists(id) returns (uint256) {
        return campaigns[id].raisedETH;
    }

    function raisedUSDC(uint256 id) external view campaignExists(id) returns (uint256) {
        return campaigns[id].raisedUSDC;
    }

    function campaignVault(uint256 id) external view campaignExists(id) returns (address) {
        return campaigns[id].vault;
    }

    function campaignOwner(uint256 id) external view campaignExists(id) returns (address) {
        return campaigns[id].owner;
    }

    function campaignEndTime(uint256 id) external view campaignExists(id) returns (uint64) {
        return campaigns[id].endTime;
    }

    // --- campaign extension ---
    function extendCampaign(uint256 id, uint64 newEndTime) external whenNotPaused campaignExists(id) {
        Campaign storage c = campaigns[id];
        if (msg.sender != c.owner) revert NotAuthorized();
        if (!c.active) revert CampaignInactive();
        if (block.timestamp >= c.endTime) revert CampaignEnded();

        if (newEndTime <= c.endTime) revert EndTimePast();
        if (newEndTime > uint64(block.timestamp) + MAX_DURATION) revert DurationTooLong();

        c.endTime = newEndTime;
        RecipientVault(c.vault).updateEndTime(newEndTime);
        emit CampaignExtended(id, newEndTime);
    }

    // --- core logic ---
    function createCampaign(address campaignOwner_, uint64 endTime, string calldata metadataURI)
        external
        whenNotPaused
        returns (uint256 campaignId)
    {
        if (campaignOwner_ == address(0)) revert OwnerZero();
        if (campaignOwner_ != msg.sender) revert NotAuthorized();
        if (endTime <= block.timestamp) revert EndTimePast();
        if (endTime > uint64(block.timestamp) + MAX_DURATION) revert DurationTooLong();
        if (bytes(metadataURI).length == 0) revert MetadataRequired();

        RecipientVault vault = new RecipientVault(address(this), campaignOwner_, endTime, USDC);

        campaignId = ++campaignCount;
        campaigns[campaignId] = Campaign({
            owner: campaignOwner_,
            vault: address(vault),
            endTime: endTime,
            active: true,
            metadataURI: metadataURI,
            raisedETH: 0,
            raisedUSDC: 0
        });

        emit CampaignCreated(campaignId, campaignOwner_, address(vault), endTime, metadataURI);
    }

    function closeCampaign(uint256 id) external whenNotPaused campaignExists(id) {
        Campaign storage c = campaigns[id];
        if (msg.sender != c.owner && msg.sender != owner) revert NotAuthorized();
        if (!c.active) revert CampaignInactive();
        c.active = false;
        emit CampaignClosed(id);
    }

    function updateMetadata(uint256 id, string calldata uri) external whenNotPaused campaignExists(id) {
        Campaign storage c = campaigns[id];
        if (msg.sender != c.owner) revert NotAuthorized();
        if (!c.active) revert CampaignInactive();
        if (block.timestamp >= c.endTime) revert CampaignEnded();
        if (bytes(uri).length == 0) revert MetadataRequired();

        c.metadataURI = uri;
        emit MetadataUpdated(id, uri);
    }

    function donateETH(uint256 id) external payable whenNotPaused nonReentrant campaignExists(id) {
        Campaign storage c = campaigns[id];
        if (!c.active) revert CampaignInactive();
        if (block.timestamp >= c.endTime) revert CampaignEnded();
        if (msg.value == 0) revert NoValue();

        c.raisedETH += msg.value;
        emit Donated(id, msg.sender, address(0), msg.value);

        (bool ok, ) = c.vault.call{value: msg.value}("");
        if (!ok) revert EthForwardFailed();
    }

    function donateUSDC(uint256 id, uint256 amount) external whenNotPaused nonReentrant campaignExists(id) {
        Campaign storage c = campaigns[id];
        if (!c.active) revert CampaignInactive();
        if (block.timestamp >= c.endTime) revert CampaignEnded();
        if (amount == 0) revert NoAmount();

        c.raisedUSDC += amount;
        emit Donated(id, msg.sender, USDC, amount);

        IERC20(USDC).safeTransferFrom(msg.sender, c.vault, amount);
        RecipientVault(c.vault).flushUSDC();
    }

    function getCampaign(uint256 id) external view campaignExists(id) returns (Campaign memory) {
        return campaigns[id];
    }
}
