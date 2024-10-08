// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 10000 * 10 ** uint256(decimals()));
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount * 10 ** uint256(decimals()));
    }
}
