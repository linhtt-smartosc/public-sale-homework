// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "./interfaces/Events.sol";
import "./SaleToken.sol";
contract SaleTokenFactory is Events {
    SaleToken[] public tokens;
    address private immutable owner;

    constructor() {
        owner = msg.sender;
    }

    function createSaleToken(
        string memory _name,
        string memory _symbol
    ) external {
        //NOTE: Should be admin (of a specific Sale Token)
        SaleToken token = new SaleToken(owner, _name, _symbol);
        tokens.push(token);
        emit ERC20TokenCreated(address(token));
    }

    function getSaleToken(address _address) public pure returns (SaleToken) {
        return SaleToken(_address);
    }

    function getSaleTokens() public view returns (SaleToken[] memory) {
        return tokens;
    }
}
