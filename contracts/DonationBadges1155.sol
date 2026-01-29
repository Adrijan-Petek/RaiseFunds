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
error NotApproved();
error UriEmpty();
error UriAlreadySet();
error ZeroAddress();
error ZeroAmount();
error LengthMismatch();
error InsufficientBalance();
error UnsafeRecipient();
error MaxOnePerWallet();
error Soulbound();
error MustMintExactlyOne();
error UriNotSet();

contract DonationBadges1155 {
    // Optional collection metadata (helps wallets / marketplaces)
    string public name;
    string public symbol;

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

    // optional: total supply per id (good for badges + UI)
    mapping(uint256 => uint256) private _totalSupply;

    // --- badge controls ---
    // If true: each wallet can hold max 1 for tokenId (campaignId)
    mapping(uint256 => bool) public onePerWallet;

    // Optional: make badges soulbound (non-transferable)
    bool public soulbound;

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

    event OnePerWalletSet(uint256 indexed id, bool enabled);
    event SoulboundSet(bool enabled);

    constructor(
        address initialOwner,
        address initialMinter,
        string memory collectionName,
        string memory collectionSymbol
    ) {
        if (initialOwner == address(0)) revert OwnerZero();
        if (initialMinter == address(0)) revert MinterZero();

        owner = initialOwner;
        minter = initialMinter;
        name = collectionName;
        symbol = collectionSymbol;

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

    function setOnePerWallet(uint256 id, bool enabled) external onlyOwner {
        onePerWallet[id] = enabled;
        emit OnePerWalletSet(id, enabled);
    }

    function setSoulbound(bool enabled) external onlyOwner {
        soulbound = enabled;
        emit SoulboundSet(enabled);
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

    function setTokenURIBatch(uint256[] calldata ids, string[] calldata uris_) external onlyOwner {
        if (ids.length != uris_.length) revert LengthMismatch();
        for (uint256 i = 0; i < ids.length; i++) {
            string calldata u = uris_[i];
            if (bytes(u).length == 0) revert UriEmpty();
            if (bytes(_tokenURIs[ids[i]]).length != 0) revert UriAlreadySet();
            _tokenURIs[ids[i]] = u;
            emit URI(u, ids[i]);
        }
    }

    // --- approvals ---
    function setApprovalForAll(address operator, bool approved) external {
        if (soulbound && approved) revert Soulbound();
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address account, address operator) public view returns (bool) {
        return _operatorApprovals[account][operator];
    }

    // --- balances / supply ---
    function balanceOf(address account, uint256 id) external view returns (uint256) {
        if (account == address(0)) revert ZeroAddress();
        return _balances[account][id];
    }

    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids)
        external
        view
        returns (uint256[] memory batchBalances)
    {
        if (accounts.length != ids.length) revert LengthMismatch();
        batchBalances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            address a = accounts[i];
            if (a == address(0)) revert ZeroAddress();
            batchBalances[i] = _balances[a][ids[i]];
        }
    }

    function totalSupply(uint256 id) external view returns (uint256) {
        return _totalSupply[id];
    }

    function totalSupplyBatch(uint256[] calldata ids) external view returns (uint256[] memory out) {
        out = new uint256[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) out[i] = _totalSupply[ids[i]];
    }

    // --- transfers ---
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external {
        if (soulbound) revert Soulbound();
        if (from == address(0) || to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (from != msg.sender && !isApprovedForAll(from, msg.sender)) revert NotApproved();

        // one-per-wallet rule: receiver must not end up with >1
        if (onePerWallet[id] && _balances[to][id] + amount > 1) revert MaxOnePerWallet();

        _transferSingle(from, to, id, amount);
        emit TransferSingle(msg.sender, from, to, id, amount);

        _doSafeTransferAcceptanceCheck(msg.sender, from, to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external {
        if (soulbound) revert Soulbound();
        if (from == address(0) || to == address(0)) revert ZeroAddress();
        if (ids.length != amounts.length) revert LengthMismatch();
        if (from != msg.sender && !isApprovedForAll(from, msg.sender)) revert NotApproved();

        // IMPORTANT: batch must NOT emit TransferSingle per id
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 amt = amounts[i];
            if (amt == 0) revert ZeroAmount();

            if (onePerWallet[ids[i]] && _balances[to][ids[i]] + amt > 1) revert MaxOnePerWallet();
            _transferSingle(from, to, ids[i], amt);
        }

        emit TransferBatch(msg.sender, from, to, ids, amounts);
        _doSafeBatchTransferAcceptanceCheck(msg.sender, from, to, ids, amounts, data);
    }

    function _transferSingle(address from, address to, uint256 id, uint256 amount) internal {
        uint256 fromBal = _balances[from][id];
        if (fromBal < amount) revert InsufficientBalance();
        unchecked {
            _balances[from][id] = fromBal - amount;
            _balances[to][id] += amount;
        }
    }

    // --- minting (only minter) ---
    function mint(address to, uint256 id, uint256 amount, bytes calldata data) external onlyMinter {
        if (bytes(_tokenURIs[id]).length == 0) revert UriNotSet();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        // one-per-wallet rule
        if (onePerWallet[id]) {
            if (_balances[to][id] != 0) revert MaxOnePerWallet();
            if (amount != 1) revert MustMintExactlyOne();
        }

        unchecked {
            _balances[to][id] += amount;
            _totalSupply[id] += amount;
        }

        emit TransferSingle(msg.sender, address(0), to, id, amount);
        _doSafeTransferAcceptanceCheck(msg.sender, address(0), to, id, amount, data);
    }

    function mintBatch(address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external onlyMinter {
        if (to == address(0)) revert ZeroAddress();
        if (ids.length != amounts.length) revert LengthMismatch();

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            if (bytes(_tokenURIs[id]).length == 0) revert UriNotSet();
            uint256 amt = amounts[i];
            if (amt == 0) revert ZeroAmount();

            if (onePerWallet[id]) {
                if (_balances[to][id] != 0) revert MaxOnePerWallet();
                if (amt != 1) revert MustMintExactlyOne();
            }

            unchecked {
                _balances[to][ids[i]] += amt;
                _totalSupply[ids[i]] += amt;
            }
        }

        emit TransferBatch(msg.sender, address(0), to, ids, amounts);
        _doSafeBatchTransferAcceptanceCheck(msg.sender, address(0), to, ids, amounts, data);
    }

    // --- burn (optional) ---
    function burn(address from, uint256 id, uint256 amount) external {
        if (from == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (from != msg.sender && !isApprovedForAll(from, msg.sender)) revert NotApproved();

        uint256 bal = _balances[from][id];
        if (bal < amount) revert InsufficientBalance();

        unchecked {
            _balances[from][id] = bal - amount;
            _totalSupply[id] -= amount;
        }

        emit TransferSingle(msg.sender, from, address(0), id, amount);
    }

    function burnBatch(address from, uint256[] calldata ids, uint256[] calldata amounts) external {
        if (from == address(0)) revert ZeroAddress();
        if (ids.length != amounts.length) revert LengthMismatch();
        if (from != msg.sender && !isApprovedForAll(from, msg.sender)) revert NotApproved();

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 amt = amounts[i];
            if (amt == 0) revert ZeroAmount();

            uint256 bal = _balances[from][id];
            if (bal < amt) revert InsufficientBalance();

            unchecked {
                _balances[from][id] = bal - amt;
                _totalSupply[id] -= amt;
            }
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
        if (!(ok && ret.length == 32 && abi.decode(ret, (bytes4)) == 0xf23a6e61)) revert UnsafeRecipient();
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
        if (!(ok && ret.length == 32 && abi.decode(ret, (bytes4)) == 0xbc197c81)) revert UnsafeRecipient();
    }
}