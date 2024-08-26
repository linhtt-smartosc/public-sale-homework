// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IPublicSale.sol";
import "./PublicSale.sol";
import "./interfaces/Events.sol";

contract PublicSaleFactory is Events {
    PublicSale[] public publicSales;

    function createPublicSale(
        address _s_token_address,
        address _b_token_address,
        uint8 _b_token_decimals,
        uint8 _s_token_decimals,
        uint256 _max_spend_per_buyer,
        uint256 _token_rate,
        uint256 _hardcap,
        uint256 _softcap,
        uint256 _duration
    ) public {
        PublicSale publicSale = new PublicSale(
            msg.sender,
            _s_token_address,
            _b_token_address,
            _b_token_decimals,
            _s_token_decimals,
            _max_spend_per_buyer,
            _token_rate,
            _hardcap,
            _softcap,
            _duration
        );
        publicSales.push(publicSale);
        emit PublicSaleCreated(address(publicSale));

    }
    function getPublicSale(address _address) public pure returns (PublicSale) {
        return PublicSale(_address);
    }
    
    function getPublicSales() public view returns (PublicSale[] memory) {
        return publicSales;
    }
    

}

