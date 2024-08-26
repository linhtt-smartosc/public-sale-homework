// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SaleToken is ERC20 {
    constructor(address owner, string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(owner, 20000 * 10 ** uint256(decimals()));
    }

    //NOTE: Should be excluded
    function mint(address account, uint256 amount) public {
        _mint(account, amount * 10 ** uint256(decimals()));
    }
}