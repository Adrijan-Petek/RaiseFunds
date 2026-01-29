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