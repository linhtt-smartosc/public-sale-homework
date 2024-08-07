// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import {IPublicSale} from "./interfaces/IPublicSale.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract PublicSale is IPublicSale, Ownable, IERC20 {
    
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
    mapping(address => BuyerInfo) private BUYERS;
    PublicsaleInfo public PUBLICSALE_INFO;
    PublicsaleStatus public PUBLICSALE_STATUS;
    States public STATE;
    uint256 public FEE;

    constructor() {
        STATE = States.CREATED;
    }

    function Initialize(
        address payable _owner,
        IERC20 _saleToken,
        IERC20 _baseToken,
        uint256 _tokenPrice,
        uint256 _maxSpend,
        uint256 _amount,
        uint256 _hardCap,
        uint256 _softCap,
        uint256 _startBlock,
        uint256 _endBlock,
        uint256 _lockPeriod
    ) public onlyOwner {
        if (STATE == States.CREATED) revert Unauthorized();

        PUBLICSALE_INFO = PublicsaleInfo({
            PRESALE_OWNER: _owner,
            S_TOKEN: _saleToken,
            B_TOKEN: _baseToken,
            TOKEN_PRICE: _tokenPrice,
            MAX_SPEND_PER_BUYER: _maxSpend,
            AMOUNT: _amount,
            HARDCAP: _hardCap,
            SOFTCAP: _softCap,
            START_BLOCK: _startBlock,
            END_BLOCK: _endBlock,
            LOCK_PERIOD: _lockPeriod
            // _owner,
            // _saleTOken
            // _baseToken
        });
        STATE = States.INITIALIZED;
    }

    function deposit(uint256 _amount) external payable {
        if (STATE == States.INITIALIZED) revert Unauthorized();
        if (msg.sender == PUBLICSALE_INFO.PRESALE_OWNER) revert Unauthorized();
        require(
            PUBLICSALE_INFO.S_TOKEN.transferFrom(
                msg.sender,
                address(this),
                _amount
            ),
            "Token Transfer fail"
        );
        emit Deposit(PUBLICSALE_INFO.PRESALE_OWNER, _amount, block.timestamp);
        STATE = States.STARTED;
    }

    function finalize() external override returns (bool) {
        if (STATE == States.STARTED) revert("Sale not start");
        unchecked {
            if (block.number > PUBLICSALE_INFO.END_BLOCK)
                revert("Sale not ended");
        }
        if (
            PUBLICSALE_STATUS.TOTAL_BASE_COLLECTED >= PUBLICSALE_INFO.SOFTCAP &&
            block.timestamp > PUBLICSALE_INFO.END_BLOCK
        ) {
            STATE = States.SUCCEEDED;
            emit Finalized(
                PUBLICSALE_INFO.PRESALE_OWNER,
                PUBLICSALE_STATUS.TOTAL_BASE_COLLECTED,
                block.timestamp
            );
            return true;
        } else {
            STATE = States.FAILED;
            emit Finalized(PUBLICSALE_INFO.PRESALE_OWNER, 0, block.timestamp);
            return false;
        }
    }

    function purchase(uint256 _amount) external returns (bool) {
        if (STATE == States.STARTED) revert("Sale not started");
        if (block.number < PUBLICSALE_INFO.START_BLOCK)
            revert("Sale not started");
        if (block.number > PUBLICSALE_INFO.END_BLOCK) revert("Sale has ended");
        if (_amount > PUBLICSALE_INFO.MAX_SPEND_PER_BUYER)
            revert PurchaseLimitExceed();

        uint256 tokens = (_amount * 10 ** 18) / PUBLICSALE_INFO.TOKEN_PRICE; // Token price == wei
        if (
            PUBLICSALE_STATUS.TOTAL_BASE_COLLECTED + _amount >
            PUBLICSALE_INFO.HARDCAP
        ) revert HardCapExceed();

        if (
            PUBLICSALE_STATUS.TOTAL_TOKENS_SOLD + tokens >
            PUBLICSALE_INFO.AMOUNT
        ) revert("not enough tokens");
        BuyerInfo storage buyer = BUYERS[msg.sender];
        buyer.baseDeposited += _amount;
        buyer.tokensOwed += tokens;

        PUBLICSALE_STATUS.TOTAL_BASE_COLLECTED += _amount;
        PUBLICSALE_STATUS.TOTAL_TOKENS_SOLD += tokens;
        PUBLICSALE_STATUS.NUM_BUYERS++;

        emit Purchase(msg.sender, _amount);
        return true;
    }

    function cancel() external override onlyOwner returns (bool) {
        if (STATE != States.STARTED) revert("Sale not started");
        if (msg.sender != PUBLICSALE_INFO.PRESALE_OWNER) revert Unauthorized();
        STATE = States.FORCE_FAILED;
        emit Cancel(msg.sender, block.timestamp);
        return true;
    }

    function claim() external override returns (uint256) {
        if (STATE != States.SUCCEEDED) revert("Sale not succesful");
        BuyerInfo storage buyer = BUYERS[msg.sender];
        uint256 tokenOwed = buyer.tokensOwed;

        if (tokenOwed == 0) revert("No tokens toclaims");
        buyer.tokensOwed = 0;
        PUBLICSALE_STATUS.TOTAL_TOKENS_WITHDRAWN += tokenOwed;
        PUBLICSALE_INFO.S_TOKEN.transfer(msg.sender, tokenOwed);
        emit TokenClaim(msg.sender, tokenOwed, block.timestamp);
        return tokenOwed;
    }

    function refund() external override returns (uint256) {
        if (STATE != States.FORCE_FAILED || STATE != States.FAILED)
            revert("No rf available");
        BuyerInfo storage buyer = BUYERS[msg.sender];
        uint256 deposited = buyer.baseDeposited;
        if (deposited == 0) revert("No funds to refund");
        buyer.baseDeposited = 0;
        PUBLICSALE_STATUS.TOTAL_BASE_WITHDRAWN += deposited;

        //rf to user
        (bool success, ) = msg.sender.call{value: deposited}("");
        require(success, "Refund failed");

        emit Refund(msg.sender, deposited, block.timestamp);
        return deposited;
    }

    function lock() external override returns (bool) {
        if (STATE != States.SUCCEEDED) revert("Sale not successful");

        uint256 totalCollected = PUBLICSALE_STATUS.TOTAL_BASE_COLLECTED;
        uint256 totalTokenSold = PUBLICSALE_STATUS.TOTAL_TOKENS_SOLD;

        if (PUBLICSALE_INFO.PRESALE_OWNER == address(0))
            revert("you need set address");
        if (
            PUBLICSALE_INFO.S_TOKEN.transfer(
                PUBLICSALE_INFO.PRESALE_OWNER,
                totalTokenSold
            )
        ) revert("Token lock fail");

        //emit lock(msg.sender,block.timestamp);
        return true;
    }
}
