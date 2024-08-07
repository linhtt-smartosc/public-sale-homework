// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {IPublicSale} from "./interfaces/IPublicSale.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PublicSale is IPublicSale, Ownable {
    using SafeERC20 for IERC20;
    struct PublicsaleInfo {
        address payable PRESALE_OWNER; // who create the sale
        IERC20 S_TOKEN; // sale token
        IERC20 B_TOKEN; // base token // usually WETH (ETH), stable tokens
        uint256 TOKEN_RATE; // 1 base token = ? s_tokens, fixed price
        uint256 MAX_SPEND_PER_BUYER; // maximum base token BUY amount/account
        uint256 AMOUNT; // the amount of presale tokens up for presale
        uint256 HARDCAP; // maximum amount of funds that the project will accept during the token sale
        uint256 SOFTCAP; // minimum amount of funds that the project aims to raise
        uint256 START_TIME; // as Unix timestamp
        uint256 END_TIME;
        uint256 DURATION;
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
        uint256 NUM_BUYERS; // number of unique participants
    }

    PublicsaleInfo public publicsale_info;
    PublicsaleStatus public publicsale_status;
    mapping(address => BuyerInfo) public BUYERS;

    constructor(
        address _s_token_address,
        address _b_token_address,
        uint256 _token_rate,
        uint256 _max_spend_per_buyer,
        uint256 _hardcap,
        uint256 _softcap,
        uint256 _duration
    ) Ownable(msg.sender) {
        if (_hardcap < _softcap) revert InvalidCapValue();
        publicsale_info.PRESALE_OWNER = payable(msg.sender);
        publicsale_info.S_TOKEN = IERC20(_s_token_address);
        publicsale_info.B_TOKEN = IERC20(_b_token_address);
        publicsale_info.TOKEN_RATE = _token_rate;
        publicsale_info.MAX_SPEND_PER_BUYER = _max_spend_per_buyer;
        publicsale_info.HARDCAP = _hardcap;
        publicsale_info.SOFTCAP = _softcap;
        publicsale_info.DURATION = _duration;
    }

    modifier inValidTime() {
        require(
            block.timestamp >= publicsale_info.START_TIME &&
                block.timestamp <= publicsale_info.END_TIME,
            "Invalid time"
        );
        _;
    }

    function deposit(uint256 _amount) external payable onlyOwner returns (uint256) {
        require(publicsale_info.AMOUNT == 0, "Deposit not allowed");
        publicsale_info.AMOUNT = _amount;
        publicsale_info.START_TIME = block.timestamp;
        publicsale_info.END_TIME = publicsale_info.START_TIME + publicsale_info.DURATION;

        publicsale_info.S_TOKEN.safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        emit Deposit(msg.sender, _amount, block.timestamp);

        return publicsale_info.AMOUNT;
    }

    function status() private view returns (States) {
        if (publicsale_status.FORCE_FAILED) return States.FORCE_FAILED;
        if (publicsale_status.TOTAL_BASE_COLLECTED >= publicsale_info.HARDCAP)
            return States.SUCCEEDED;
        if (block.timestamp > publicsale_info.END_TIME) {
            if (
                publicsale_status.TOTAL_BASE_COLLECTED >=
                publicsale_info.SOFTCAP
            ) return States.SUCCEEDED;
            return States.FAILED;
        }
        return States.STARTED;
    }

    function purchase(uint256 _base_token_amount) external inValidTime returns (bool) {
        require(status() == States.STARTED, "Purchase not allowed");
        if (_base_token_amount > publicsale_info.MAX_SPEND_PER_BUYER)
            revert PurchaseLimitExceed(publicsale_info.MAX_SPEND_PER_BUYER);
        if (
            BUYERS[msg.sender].baseDeposited + _base_token_amount >
            publicsale_info.MAX_SPEND_PER_BUYER
        ) revert PurchaseLimitExceed(publicsale_info.MAX_SPEND_PER_BUYER);

        uint256 remaining = publicsale_info.HARDCAP -
            publicsale_status.TOTAL_BASE_COLLECTED;
        if (
            publicsale_status.TOTAL_BASE_COLLECTED + _base_token_amount >
            publicsale_info.HARDCAP
        ) revert HardCapExceed(remaining);

        BUYERS[msg.sender].baseDeposited += _base_token_amount;
        uint256 tokenOwed = _base_token_amount / publicsale_info.TOKEN_RATE;
        BUYERS[msg.sender].tokensOwed += tokenOwed;
        publicsale_status.TOTAL_BASE_COLLECTED += _base_token_amount;
        publicsale_status.TOTAL_TOKENS_SOLD += tokenOwed;
        publicsale_status.NUM_BUYERS += 1;

        emit Purchase(msg.sender, _base_token_amount);

        return true;
    }

    function cancel() external onlyOwner inValidTime returns (bool) {
        require(status() == States.STARTED, "Cancel not allowed");
        publicsale_status.FORCE_FAILED = true;
        publicsale_info.END_TIME = block.timestamp;

        emit Cancel(msg.sender, block.timestamp);

        return true;
    }

    function claim() external returns (uint256) {
        require(status() == States.SUCCEEDED, "Claim not allowed");
        require(BUYERS[msg.sender].tokensOwed > 0, "No tokens to claim");
        if (
            publicsale_status.TOTAL_TOKENS_WITHDRAWN +
                BUYERS[msg.sender].tokensOwed >
            publicsale_info.AMOUNT
        ) revert NotClaimable();

        uint256 amount = BUYERS[msg.sender].tokensOwed;
        BUYERS[msg.sender].tokensOwed = 0;
        publicsale_info.S_TOKEN.safeTransferFrom(
            address(this),
            msg.sender,
            amount
        );

        emit TokenClaim(msg.sender, amount, block.timestamp);

        return amount;
    }

    function refund() external returns (uint256) {
        require(
            (status() == States.FORCE_FAILED || status() == States.FAILED),
            "Refund not allowed"
        );
        require(
            BUYERS[msg.sender].baseDeposited > 0,
            "No base tokens to refund"
        );
        if (
            publicsale_status.TOTAL_BASE_WITHDRAWN +
                BUYERS[msg.sender].baseDeposited >
            publicsale_status.TOTAL_BASE_COLLECTED
        ) revert NotRefundable();

        uint256 amount = BUYERS[msg.sender].baseDeposited;
        BUYERS[msg.sender].baseDeposited = 0;
        publicsale_info.B_TOKEN.safeTransferFrom(
            address(this),
            msg.sender,
            amount
        );

        emit Refund(msg.sender, amount, block.timestamp);

        return amount;
    }

}
