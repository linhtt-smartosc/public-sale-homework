// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import { IERC20 } from "./interfaces/IERC20.sol";
import { IPublicSale } from "./interfaces/IPublicSale.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
 import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract PublicSale is IPublicSale {
    struct PublicsaleInfo {
        address payable PRESALE_OWNER; // who create the sale
        ERC20 S_TOKEN; // sale token
        ERC20 B_TOKEN; // base token // usually WETH (ETH), stable tokens
        uint256 TOKEN_PRICE; // 1 base token = ? s_tokens, fixed price
        uint256 MAX_SPEND_PER_BUYER; // maximum base token BUY amount/account
        uint256 MINIMUM_PURCHASE_AMOUNT;
        uint256 AMOUNT; // the amount of presale tokens up for presale
        uint256 HARDCAP; // maximum amount of funds (WETH) that the project will accept during the token sale
        uint256 SOFTCAP; // minimum amount of funds (WETH) that the project aims to raise
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
        SUCCEEDED, // hard cap met // endblock and soft cap met
        FINALIZED,
        LOCKED
        }

    mapping(address => BuyerInfo) public buyers;

    PublicsaleInfo public publicsale_info;
    PublicsaleStatus public publicsale_status;
    States public state;
    uint256 public FEE;

    bool public locked;

    address payable owner;
    modifier onlyCurrentState(States _state) {
        if (state != _state) {
            revert InvalidState(uint8(_state));
        } 
        _;
    }
    modifier onlyOwner {
        if  (msg.sender != publicsale_info.PRESALE_OWNER) revert Unauthorized();
        _;
    }
    modifier notLocked() {
        require(!locked, "Contract is locked");
        _;
    }
    modifier onlyRefundable() {

        if (state != States.FORCE_FAILED || state != States.FAILED 
            || (block.timestamp > publicsale_info.END_BLOCK && publicsale_status.TOTAL_BASE_COLLECTED < publicsale_info.SOFTCAP)) {
                revert NotRefundable();
            }
        _;
    }

    // payable co dung cho moi owner dc ko
    constructor(
        address payable _presaleOwner,
        ERC20 _sToken,
        ERC20 _bToken,
        uint256 _amount,
        uint256 _token_price,
        uint256 _endBlock,
        uint256 _startBlock) {
        publicsale_info.PRESALE_OWNER = _presaleOwner;
        publicsale_info.S_TOKEN = _sToken;
        publicsale_info.B_TOKEN = _bToken;
        publicsale_info.TOKEN_PRICE = _token_price;
        publicsale_info.MAX_SPEND_PER_BUYER = 100;
        publicsale_info.AMOUNT = _amount;
        publicsale_info.HARDCAP = 1500;
        publicsale_info.SOFTCAP = 500;
        publicsale_info.START_BLOCK = _startBlock; // TODO: How to know current block
        publicsale_info.END_BLOCK = _endBlock; // TODO: How to know expected end block
        publicsale_info.LOCK_PERIOD = 2 weeks;
        state = States.CREATED;
        
    }


    /**
     * @dev Allows for the deposit of public sale tokens by the owner.
     * This function is intended to be called by the public sale contract owner to
     * deposit the tokens that are to be sold during the public sale.
     * 
     * @return The amount of tokens deposited for the public sale.
     */
    //TODO: an user deposit manys times: no
    //TODO: Why retricts use with only owner, so stupid: Intended
    function deposit() external override 
        onlyCurrentState(States.CREATED) 
        onlyOwner()
        notLocked()
        returns (uint256)  
        {
        if (block.number < publicsale_info.START_BLOCK) revert NotInPurchasePeriod();
        if (block.number >= publicsale_info.END_BLOCK) revert NotInPurchasePeriod();

        // TODO: Lieu co phai la tien tu vi nguoi owner duoc dua vao day
        // Co, tu hop dong ERC20 S.TOKEN
        // Truoc do o hop dong ERC20 da xu ly approve roi


        ERC20(publicsale_info.S_TOKEN).transferFrom(msg.sender, address(this), publicsale_info.AMOUNT);
        state = States.STARTED;
        return  publicsale_info.AMOUNT;
    }

    /**
     * @dev Finalizes the public sale, allowing for the distribution of tokens to
     * participants and the withdrawal of funds raised to the beneficiary. This
     * function is typically called after the public sale ends, assuming it meets
     * any predefined criteria such as minimum funding goals.
     * 
     * @return A boolean value indicating whether the public sale was successfully
     * finalized.
     */
    function finalize() external override 
        onlyCurrentState(States.STARTED)
        onlyOwner()
        notLocked()
        returns (bool) {
        if ( block.timestamp < publicsale_info.END_BLOCK && publicsale_status.TOTAL_BASE_COLLECTED < publicsale_info.SOFTCAP){
            revert SoftCapNotReached();
        }

        uint256 amount = publicsale_info.AMOUNT - publicsale_status.TOTAL_TOKENS_SOLD;

        ERC20(publicsale_info.S_TOKEN).transfer(msg.sender, amount);
        
        emit Finalized(msg.sender, amount, block.timestamp);
        state = States.FINALIZED;
        return true;
    }
    /**
     * @dev Enables participants to purchase tokens during the public sale event.
     * This function is typically called by participants to contribute funds and
     * receive tokens in return.
     * 
     * @notice The function should revert if the public sale is not active or if the
     * participant's contribution exceeds the maximum allowed per buyer. (DONE)
     * 
     * @return A boolean value indicating whether the purchase was successful.
     */
    function purchase(address beneficiary, uint256 contribution) external override
        onlyCurrentState(States.STARTED)
        notLocked() returns (bool) {
        //Check in purchase period
        if (block.number <= publicsale_info.END_BLOCK) revert NotInPurchasePeriod();

        //Check hardcap => HardCapExceed()
        if (publicsale_status.TOTAL_BASE_COLLECTED + contribution <= publicsale_info.HARDCAP) revert HardCapExceed();
        
         // Check purchase amount is within limits
        if(contribution >= publicsale_info.MINIMUM_PURCHASE_AMOUNT) revert PurchaseBelowMinimum();
        if(contribution <= publicsale_info.MAX_SPEND_PER_BUYER) revert  PurchaseLimitExceed();
        

        // 1. Transfer BASE TOKEN from beneficiary to contract
        ERC20(publicsale_info.B_TOKEN).transferFrom(msg.sender, address(this), contribution);

        // 2. Update amount of money of total pool (publicsale_status) and of beneficiary (buyers)
        uint256 tokenOwed = contribution * publicsale_info.TOKEN_PRICE;

        publicsale_status.TOTAL_BASE_COLLECTED += contribution;
        publicsale_status.TOTAL_TOKENS_SOLD += tokenOwed;

        buyers[beneficiary].baseDeposited += contribution;
        buyers[beneficiary].tokensOwed += tokenOwed;


        //TODO: Check if this should be done: probably not, as transfer means cannot return to owner in case of FORCE FAILED
        // 3. Transfer S_TOKEN to beneficiary
        // Doesn't require transferFrom here
        // PUBLICSALE_INFO.S_TOKEN.transfer(beneficiary, tokenOwed);

        // Emit event Purchase(address indexed beneficiary, uint256 contribution);
        emit Purchase(beneficiary, contribution);

        return true;

    }

    /**
     * @dev Cancels the public sale and enables the refund process for participants.
     * This function can be used in scenarios where the public sale does not meet
     * its goals or if the organizer decides to cancel the event for any reason.
     * 
     * @return A boolean value indicating whether the public sale was successfully
     * cancelled.
     */
    function cancel() external override  
        onlyOwner()
        onlyCurrentState(States.STARTED) 
        notLocked()
        returns (bool) {
        //Change state to FORCE_FAILED
        state = States.FORCE_FAILED;

        uint256 amountToReturn = publicsale_info.AMOUNT;
        ERC20(publicsale_info.S_TOKEN).transferFrom(address(this), msg.sender, amountToReturn);
        publicsale_status.TOTAL_TOKENS_WITHDRAWN = amountToReturn;
        publicsale_status.TOTAL_TOKENS_SOLD = 0;
        //emit event Cancel(address indexed creator, uint256 timestamp);
        emit Cancel(msg.sender, block.timestamp);
        return true;
    }


    /**
     * @dev Allows participants to claim their purchased tokens after the public sale
     * is finalized. Participants call this function to receive the tokens they
     * are entitled to.
     * 
     * @return The amount of tokens claimed by the caller.
     */
    function claim() external override 
        onlyCurrentState(States.FINALIZED) 
        notLocked()
        returns (uint256) {
        if (buyers[msg.sender].baseDeposited != 0) revert NotClaimable();

        BuyerInfo memory beneficiary = buyers[msg.sender];
        uint256 tokensOwed = beneficiary.tokensOwed;
        publicsale_info.S_TOKEN.transfer(msg.sender, tokensOwed);

        publicsale_status.TOTAL_TOKENS_SOLD -= tokensOwed;

        beneficiary.tokensOwed = 0;

        emit TokenClaim(msg.sender, tokensOwed, block.timestamp);

        if (publicsale_status.TOTAL_TOKENS_SOLD == 0) {
            state = States.LOCKED;
        }

        return tokensOwed;
    }

    /**
     * @dev Enables participants to request a refund of their contribution if the
     * public sale is cancelled or if they are otherwise eligible for a refund
     * according to the public sale's terms.
     * 
     * @return The amount of funds refunded to the caller.
     */
    function refund() external override 
        onlyRefundable() 
        notLocked() returns (uint256) {
        
        //TODO: check user has money in BUYERS
        if (buyers[msg.sender].baseDeposited == 0 ) {
            revert NotRefundable();
        }

        uint256 amount = buyers[msg.sender].baseDeposited;

        if (address(this).balance >= amount) {
            buyers[msg.sender].baseDeposited =0;
            ERC20(publicsale_info.B_TOKEN).transfer(msg.sender, amount);
            buyers[msg.sender].tokensOwed =0;
            publicsale_status.TOTAL_BASE_WITHDRAWN -= amount;
            //Emit event Refund(address indexed beneficiary, uint256 amount, uint256 timestamp);
            emit Refund(msg.sender, amount, block.timestamp);
        }
        if (publicsale_status.TOTAL_BASE_WITHDRAWN == 0) {
            state = States.LOCKED;
        }
        return amount;
    }

    /**
     * @dev Locks the public sale contract to prevent further modifications.
     * 
     * @return A boolean value indicating whether the contract was successfully locked.
     */
    function lock() external onlyOwner override returns (bool) {
        locked = true;
        return true;
    }

}
