// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/Forwarder.sol";
import "../src/DonationBadges1155.sol";

contract DeployRaiseFunds is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address protocolOwner = vm.envAddress("PROTOCOL_OWNER");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Forwarder contract
        // USDC address is hardcoded in contract
        Forwarder forwarder = new Forwarder(protocolOwner);
        console.log("Forwarder deployed at:", address(forwarder));

        // Deploy DonationBadges1155 contract
        address initialOwner = protocolOwner;
        address initialMinter = protocolOwner; // Backend will be set as minter later

        DonationBadges1155 badges = new DonationBadges1155(
            initialOwner,
            initialMinter,
            "RaiseFunds Donation Badges",
            "RFDB"
        );
        console.log("DonationBadges1155 deployed at:", address(badges));

        vm.stopBroadcast();
    }
}