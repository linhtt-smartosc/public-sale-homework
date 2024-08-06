// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import { IERC20 } from "./interfaces/IERC20.sol";
import { IPublicSale } from "./interfaces/IPublicSale.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
 
abstract contract PublicSale is IPublicSale {
    struct PublicsaleInfo {
        address payable PRESALE_OWNER; // who create the sale
        IERC20 S_TOKEN; // sale token
        IERC20 B_TOKEN; // base token // usually WETH (ETH), stable tokens
        uint256 TOKEN_PRICE; // 1 base token = ? s_tokens, fixed price
        uint256 MAX_SPEND_PER_BUYER; // maximum base token BUY amount/account
        uint256 AMOUNT; // the amount of presale tokens up for presale
        uint256 HARDCAP; // maximum amount of funds that the project will accept during the token sale
        uint256 SOFTCAP; // minimum amount of funds that the project aims to raise
        uint256 START_BLOCK;
        uint256 END_BLOCK;
        uint256 LOCK_PERIOD; // unix timestamp -> e.g. 2 weeks
    }
    struct BuyerInfo {
        uint256 baseDeposited; // total base token (usually ETH) deposited by user, can be withdrawn on presale failure
        uint256 tokensOwed; // num presale tokens a user is owed, can be withdrawn on presale success
    }
    mapping(address => BuyerInfo) public BUYERS;
    struct PublicsaleStatus {
        bool FORCE_FAILED; // set this flag to force fail the presale
        uint256 TOTAL_BASE_COLLECTED; // total base currency raised
        uint256 TOTAL_TOKENS_SOLD; // total public sale tokens sold
        uint256 TOTAL_TOKENS_WITHDRAWN; // total tokens withdrawn post successful public sale
        uint256 TOTAL_BASE_WITHDRAWN; // total base tokens withdrawn on public sale failure
        uint256 ROUND1_LENGTH; // in blocks (END_BLOCK - START_BLOCK)
        uint256 NUM_BUYERS; // number of unique participants
    }

    enum States {
        CREATED,
        INITIALIZED, // after init
        STARTED, // after deposit 
        FORCE_FAILED, // force failed by owner
        FAILED,
        SUCCEEDED
    }

    PublicsaleInfo public PUBLICSALE_INFO;
    PublicsaleStatus public PUBLICSALE_STATUS;
    States public STATE;
    uint256 public FEE;

    constructor(address owner) {
        // Additional constructor logic if needed
    }

    function deposit() external override returns (uint256) {}

    function finalize() external override returns (bool) {}

    function purchase() external override returns (bool) {}

    function cancel() external override returns (bool) {}

    function claim() external override returns (uint256) {}

    function refund() external override returns (uint256) {}

    function lock() external override returns (bool) {}
}
