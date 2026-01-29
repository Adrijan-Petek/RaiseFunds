# RaiseFunds Smart Contracts

This directory contains the smart contracts for the RaiseFunds decentralized fundraising platform.

## Forwarder.sol

The `Forwarder.sol` contract implements a donation system specifically designed for the Base network. It allows users to donate ETH and native USDC (Circle USDC) to fundraising campaigns.

### Key Features

- **Multi-Asset Donations**: Accepts both ETH and USDC donations
- **Immediate Forwarding**: Funds are forwarded immediately to campaign owners, not held in contracts long-term
- **Campaign Management**: Create, close, and update campaign metadata
- **Security**: Includes reentrancy protection and access controls
- **Base Network Optimized**: Uses Base mainnet USDC address

### Architecture

The system consists of two main contracts:

1. **Forwarder**: The main contract that handles donations and campaign creation
2. **RecipientVault**: A per-campaign contract that acts as the campaign's "wallet"

### How It Works

1. **Campaign Creation**: Anyone can create a campaign by calling `createCampaign()`, which deploys a new `RecipientVault`
2. **Donations**:
   - ETH donations: Call `donateETH()` with the campaign ID and send ETH
   - USDC donations: Approve the Forwarder for USDC, then call `donateUSDC()`
3. **Fund Forwarding**: Funds are immediately forwarded from the vault to the campaign owner's EOA
4. **Campaign Closure**: Campaign owners can close campaigns early or let them end naturally

### Network Constants

- **USDC Address**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Base mainnet native Circle USDC)

### Events

- `CampaignCreated`: Emitted when a new campaign is created
- `CampaignClosed`: Emitted when a campaign is closed
- `MetadataUpdated`: Emitted when campaign metadata is updated
- `Donated`: Emitted for each donation (ETH or USDC)

### Security Considerations

- Reentrancy protection on donation functions
- Only the Forwarder can send funds to vaults
- Donations are rejected after campaign end time
- Forced ETH (via selfdestruct) can be recovered by campaign owners after campaign end

### Deployment

Deploy the `Forwarder` contract with the protocol owner's address as the constructor parameter.

```solidity
constructor(address protocolOwner) Ownable(protocolOwner) {}
```

### Usage Example

```solidity
// Create a campaign
uint256 campaignId = forwarder.createCampaign(ownerAddress, endTime, metadataURI);

// Donate ETH
forwarder.donateETH{value: amount}(campaignId);

// Donate USDC (after approval)
forwarder.donateUSDC(campaignId, amount);
```

### Testing

The contract includes comprehensive error handling and should be thoroughly tested on Base testnet before mainnet deployment.

### License

MIT

## DonationBadges1155.sol

The `DonationBadges1155.sol` contract is an ERC-1155 token contract that mints donation badges to donors after successful donations. It integrates with the Forwarder contract to provide NFT rewards for contributions.

### Key Features

- **ERC-1155 Standard**: Supports multiple token types and batch operations
- **Per-Token URIs**: Each token ID (campaign ID) has its own metadata URI
- **Controlled Minting**: Only authorized minters (backend or minter contract) can mint badges
- **Burn Functionality**: Holders can burn their badges if desired
- **IPFS Metadata**: Designed for web3.storage/IPFS hosting of badge metadata

### How It Works

1. **Setup**: Deploy with owner and minter addresses
2. **Set URIs**: Owner sets token URIs for each campaign (tokenId == campaignId)
3. **Minting**: After observing a `Donated` event from Forwarder, the minter calls `mint()` to award badges
4. **Transfers**: Standard ERC-1155 transfers and approvals
5. **Burning**: Optional burning of badges by holders

### Metadata Example

```json
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
```

### Deployment

```solidity
constructor(address initialOwner, address initialMinter)
```

### Usage Example

```solidity
// Set URI for campaign 1
badges.setTokenURI(1, "ipfs://<CID>/badge.json");

// Mint badge to donor
badges.mint(donorAddress, 1, 1, "");
```

### Integration with Forwarder

- Listen for `Donated` events from Forwarder
- Mint badges via backend/minter contract
- No onchain verification of donation amounts (MVP approach)