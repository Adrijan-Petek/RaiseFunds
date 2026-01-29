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
}

contract RecipientVault {
    using SafeERC20 for IERC20;
    using Address for address payable;

    address public immutable forwarder;
    address public immutable campaignOwner;
    uint64  public immutable endTime;
    IERC20  public immutable usdc;

    event SweptETH(address indexed owner, uint256 amount);
    event SweptUSDC(address indexed owner, uint256 amount);

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
        if (block.timestamp >= endTime) revert Ended(); // ✅ symmetry with ETH
        uint256 bal = usdc.balanceOf(address(this));
        if (bal > 0) usdc.safeTransfer(campaignOwner, bal);
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

    address public constant USDC = address(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    uint64 public constant MAX_DURATION = 365 days;

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
    event MetadataUpdated(uint256 indexed campaignId, string metadataURI);
    event Donated(uint256 indexed campaignId, address indexed donor, address indexed token, uint256 amount);

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

    constructor(address protocolOwner) Ownable(protocolOwner) {}

    receive() external payable { revert DirectEthNotAllowed(); }
    fallback() external payable { revert DirectCallNotAllowed(); }

    modifier campaignExists(uint256 id) {
        if (campaigns[id].owner == address(0)) revert CampaignNotFound();
        _;
    }

    function usdcAddress() external pure returns (address) { return USDC; }

    function createCampaign(address campaignOwner, uint64 endTime, string calldata metadataURI)
        external
        returns (uint256 campaignId)
    {
        if (campaignOwner == address(0)) revert OwnerZero();
        if (campaignOwner != msg.sender) revert NotAuthorized();
        if (endTime <= block.timestamp) revert EndTimePast();
        if (endTime > uint64(block.timestamp) + MAX_DURATION) revert DurationTooLong();
        if (bytes(metadataURI).length == 0) revert MetadataRequired();

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

    function closeCampaign(uint256 id) external campaignExists(id) {
        Campaign storage c = campaigns[id];
        if (msg.sender != c.owner && msg.sender != owner) revert NotAuthorized();
        if (!c.active) revert CampaignInactive();
        c.active = false;
        emit CampaignClosed(id);
    }

    function updateMetadata(uint256 id, string calldata uri) external campaignExists(id) {
        Campaign storage c = campaigns[id];
        if (msg.sender != c.owner) revert NotAuthorized();
        if (!c.active) revert CampaignInactive();
        if (block.timestamp >= c.endTime) revert CampaignEnded();
        if (bytes(uri).length == 0) revert MetadataRequired();
        c.metadataURI = uri;
        emit MetadataUpdated(id, uri);
    }

    function donateETH(uint256 id) external payable nonReentrant campaignExists(id) {
        Campaign storage c = campaigns[id];
        if (!c.active) revert CampaignInactive();
        if (block.timestamp >= c.endTime) revert CampaignEnded();
        if (msg.value == 0) revert NoValue();

        c.raisedETH += msg.value;
        emit Donated(id, msg.sender, address(0), msg.value);

        (bool ok, ) = c.vault.call{value: msg.value}("");
        if (!ok) revert EthForwardFailed();
    }

    function donateUSDC(uint256 id, uint256 amount) external nonReentrant campaignExists(id) {
        Campaign storage c = campaigns[id];
        if (!c.active) revert CampaignInactive();
        if (block.timestamp >= c.endTime) revert CampaignEnded();
        if (amount == 0) revert NoAmount();

        c.raisedUSDC += amount;
        emit Donated(id, msg.sender, USDC, amount);

        IERC20(USDC).safeTransferFrom(msg.sender, c.vault, amount);
        RecipientVault(c.vault).flushUSDC(); // will now also revert if ended
    }

    function getCampaign(uint256 id) external view campaignExists(id) returns (Campaign memory) {
        return campaigns[id];
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
}
