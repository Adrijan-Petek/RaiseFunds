// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/*
RaiseFunds Donation Badges (ERC-1155, Base)
==========================================
Designed to work with your Forwarder contract:

- tokenId == campaignId (simple mapping)
- Mint "donation badge" to donor after a successful donation (your backend or a small minter contract calls mint)
- Metadata hosted on web3.storage / IPFS
- Uses per-token URI (not a single base URI) because marketplaces/indexers are more reliable with explicit URIs

HOW TO USE WITH web3.storage
- Upload a folder per campaign badge metadata (or per tier) to web3.storage
- Set token URI to: ipfs://<CID>/badge.json
- `badge.json` example:

{
  "name": "RaiseFunds Donation Badge #12",
  "description": "Thanks for donating to campaign #12 on Base.",
  "image": "ipfs://bafy.../badge.png",
  "external_url": "https://yourdomain.xyz/campaign/12",
  "attributes": [
    { "trait_type": "campaignId", "value": 12 },
    { "trait_type": "chainId", "value": 8453 },
    { "trait_type": "platform", "value": "RaiseFunds" }
  ]
}

NOTES
- This contract does NOT verify donation amounts onchain (cheap MVP).
  Your backend should only mint after it observes a Donation event from Forwarder.
- If you want onchain verification later, add a `Minter` that checks Forwarder counters or uses signed proofs.
*/

error OwnerZero();
error NotOwner();
error MinterZero();
error NotMinter();
error UriEmpty();
error UriAlreadySet();
error ZeroAddress();
error ZeroAmount();

contract DonationBadges1155 {
    // --- ownership ---
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // --- mint authority (backend/minter contract) ---
    address public minter;
    event MinterUpdated(address indexed previousMinter, address indexed newMinter);

    modifier onlyMinter() {
        if (msg.sender != minter) revert NotMinter();
        _;
    }

    // --- ERC1155 storage ---
    // per-token URI (tokenId => uri)
    mapping(uint256 => string) private _tokenURIs;

    // balances: owner => (id => amount)
    mapping(address => mapping(uint256 => uint256)) private _balances;

    // operator approvals: owner => (operator => approved)
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // --- ERC165 / interface ids ---
    // IERC165: 0x01ffc9a7
    // IERC1155: 0xd9b67a26
    // IERC1155MetadataURI: 0x0e89341c
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 ||
            interfaceId == 0xd9b67a26 ||
            interfaceId == 0x0e89341c;
    }

    // --- ERC1155 events ---
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);

    constructor(address initialOwner, address initialMinter) {
        if (initialOwner == address(0)) revert OwnerZero();
        if (initialMinter == address(0)) revert MinterZero();
        owner = initialOwner;
        minter = initialMinter;
        emit OwnershipTransferred(address(0), initialOwner);
        emit MinterUpdated(address(0), initialMinter);
    }

    // --- admin ---
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert OwnerZero();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setMinter(address newMinter) external onlyOwner {
        if (newMinter == address(0)) revert MinterZero();
        emit MinterUpdated(minter, newMinter);
        minter = newMinter;
    }

    // --- metadata ---
    function uri(uint256 id) external view returns (string memory) {
        return _tokenURIs[id];
    }

    /// @notice Set token URI ONCE (recommended). tokenId == campaignId.
    function setTokenURI(uint256 id, string calldata newURI) external onlyOwner {
        if (bytes(newURI).length == 0) revert UriEmpty();
        if (bytes(_tokenURIs[id]).length != 0) revert UriAlreadySet();
        _tokenURIs[id] = newURI;
        emit URI(newURI, id);
    }

    /// @notice Optional: allow owner to set many URIs in one tx.
    function setTokenURIBatch(uint256[] calldata ids, string[] calldata uris_) external onlyOwner {
        if (ids.length != uris_.length) revert UriEmpty();
        for (uint256 i = 0; i < ids.length; i++) {
            string calldata u = uris_[i];
            if (bytes(u).length == 0) revert UriEmpty();
            if (bytes(_tokenURIs[ids[i]]).length != 0) revert UriAlreadySet();
            _tokenURIs[ids[i]] = u;
            emit URI(u, ids[i]);
        }
    }

    // --- ERC1155 approvals ---
    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address account, address operator) public view returns (bool) {
        return _operatorApprovals[account][operator];
    }

    // --- balances ---
    function balanceOf(address account, uint256 id) external view returns (uint256) {
        if (account == address(0)) revert ZeroAddress();
        return _balances[account][id];
    }

    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids)
        external
        view
        returns (uint256[] memory batchBalances)
    {
        if (accounts.length != ids.length) revert UriEmpty();
        batchBalances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            address a = accounts[i];
            if (a == address(0)) revert ZeroAddress();
            batchBalances[i] = _balances[a][ids[i]];
        }
    }

    // --- transfers ---
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external {
        if (to == address(0)) revert ZeroAddress();
        if (from != msg.sender && !isApprovedForAll(from, msg.sender)) revert NotOwner();
        _safeTransfer(from, to, id, amount);
        _doSafeTransferAcceptanceCheck(msg.sender, from, to, id, amount, data);
    }

    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data)
        external
    {
        if (to == address(0)) revert ZeroAddress();
        if (ids.length != amounts.length) revert UriEmpty();
        if (from != msg.sender && !isApprovedForAll(from, msg.sender)) revert NotOwner();

        for (uint256 i = 0; i < ids.length; i++) {
            _safeTransfer(from, to, ids[i], amounts[i]);
        }
        emit TransferBatch(msg.sender, from, to, ids, amounts);
        _doSafeBatchTransferAcceptanceCheck(msg.sender, from, to, ids, amounts, data);
    }

    function _safeTransfer(address from, address to, uint256 id, uint256 amount) internal {
        uint256 fromBal = _balances[from][id];
        require(fromBal >= amount, "INSUFFICIENT_BALANCE");
        unchecked {
            _balances[from][id] = fromBal - amount;
            _balances[to][id] += amount;
        }
        emit TransferSingle(msg.sender, from, to, id, amount);
    }

    // --- minting (only minter) ---
    function mint(address to, uint256 id, uint256 amount, bytes calldata data) external onlyMinter {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        _balances[to][id] += amount;
        emit TransferSingle(msg.sender, address(0), to, id, amount);
        _doSafeTransferAcceptanceCheck(msg.sender, address(0), to, id, amount, data);
    }

    function mintBatch(address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external onlyMinter {
        if (to == address(0)) revert ZeroAddress();
        if (ids.length != amounts.length) revert UriEmpty();

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 amt = amounts[i];
            if (amt == 0) revert ZeroAmount();
            _balances[to][ids[i]] += amt;
        }

        emit TransferBatch(msg.sender, address(0), to, ids, amounts);
        _doSafeBatchTransferAcceptanceCheck(msg.sender, address(0), to, ids, amounts, data);
    }

    // --- burn (optional, allow holders to burn their badge if they want) ---
    function burn(address from, uint256 id, uint256 amount) external {
        if (from != msg.sender && !isApprovedForAll(from, msg.sender)) revert NotOwner();
        uint256 bal = _balances[from][id];
        require(bal >= amount, "INSUFFICIENT_BALANCE");
        unchecked { _balances[from][id] = bal - amount; }
        emit TransferSingle(msg.sender, from, address(0), id, amount);
    }

    function burnBatch(address from, uint256[] calldata ids, uint256[] calldata amounts) external {
        if (ids.length != amounts.length) revert UriEmpty();
        if (from != msg.sender && !isApprovedForAll(from, msg.sender)) revert NotOwner();

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 amt = amounts[i];
            uint256 bal = _balances[from][id];
            require(bal >= amt, "INSUFFICIENT_BALANCE");
            unchecked { _balances[from][id] = bal - amt; }
        }
        emit TransferBatch(msg.sender, from, address(0), ids, amounts);
    }

    // --- receiver checks (IERC1155Receiver) ---
    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) private {
        if (to.code.length == 0) return;
        // IERC1155Receiver.onERC1155Received.selector == 0xf23a6e61
        (bool ok, bytes memory ret) = to.call(
            abi.encodeWithSelector(0xf23a6e61, operator, from, id, value, data)
        );
        require(ok && ret.length == 32 && abi.decode(ret, (bytes4)) == 0xf23a6e61, "UNSAFE_RECIPIENT");
    }

    function _doSafeBatchTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) private {
        if (to.code.length == 0) return;
        // IERC1155Receiver.onERC1155BatchReceived.selector == 0xbc197c81
        (bool ok, bytes memory ret) = to.call(
            abi.encodeWithSelector(0xbc197c81, operator, from, ids, values, data)
        );
        require(ok && ret.length == 32 && abi.decode(ret, (bytes4)) == 0xbc197c81, "UNSAFE_RECIPIENT");
    }
}