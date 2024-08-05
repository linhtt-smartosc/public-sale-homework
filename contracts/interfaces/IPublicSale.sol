// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * This interface outlines the functions related to managing and interacting
 * with public sale contracts. It includes capabilities such as depositing funds,
 * finalizing the public sale, canceling the public sale, claiming tokens, and refunding
 * contributions. Implementing contracts should provide the logic for these
 * operations in the context of a public sale event.
 */
interface IPublicsale {
    
    /**
     * @dev Emitted when an unauthorized address attempts an action requiring specific permissions.
     */
    error Unauthorized();

    /**
     * @dev Emitted when an action is performed in an invalid state.
     * @param currentState The current state of the contract.
     */
    error InvalidState(uint8 currentState);

    /**
     * @dev Emitted when attempting to finalize a public sale that has not reached its soft cap.
     */
    error SoftCapNotReached();

    /**
     * @dev Emitted when a purchase attempt exceeds the public sale's hard cap.
     */
    error HardCapExceed();

    /**
     * @dev Emitted when user with no contribution attempts to claim tokens.
     */
    error NotClaimable();

    /**
     * @dev Emitted when a purchase or refund attempt is made outside the public sale period.
     */
    error NotInPurchasePeriod();

    /**
     * @dev Emitted when a purchase amount is below the minimum allowed.
     */
    error PurchaseBelowMinimum();

    /**
     * @dev Emitted when a participant's purchase would exceed the maximum allowed contribution.
     */
    error PurchaseLimitExceed();

    /**
     * @dev Emitted when a refund is requested under conditions that do not permit refunds.
     */
    error NotRefundable();

    /**
     * @dev Emitted when the process of adding liquidity to a liquidity pool fails.
     */
    error LiquificationFailed();

    /**
     * @dev Emitted when the initialization parameters provided to the contract are invalid.
     */
    error InvalidInitializationParameters();

    /**
     * @dev Emitted when the pool validation parameters provided to the contract are invalid.
     */
    error InvalidCapValue();

    /**
     * @dev Emitted when the pool validation parameters provided to the contract are invalid.
     */
    error InvalidLimitValue();

    /**
     * @dev Emitted when the pool validation parameters provided to the contract are invalid.
     */
    error InvalidLiquidityValue();


    /**
     * @dev Emitted when the pool validation parameters provided to the contract are invalid.
     */
    error InvalidTimestampValue();

    /**
     * @dev Emitted when the public sale contract owner deposits tokens for sale.
     * This is usually done before the public sale starts to ensure tokens are available for purchase.
     * @param creator Address of the contract owner who performs the deposit.
     * @param amount Amount of tokens deposited.
     * @param timestamp Block timestamp when the deposit occurred.
     */
    event Deposit(address indexed creator, uint256 amount, uint256 timestamp);

    /**
     * @dev Emitted for each purchase made during the public sale. Tracks the buyer, the amount of ETH contributed,
     * and the amount of tokens purchased.
     * @param beneficiary Address of the participant who made the purchase.
     * @param contribution Amount of ETH contributed by the participant.
     */
    event Purchase(address indexed beneficiary, uint256 contribution);

    /**
     * @dev Emitted when the public sale is successfully finalized. Finalization may involve distributing tokens,
     * transferring raised funds to a designated wallet, and/or enabling token claim functionality.
     * @param creator Address of the contract owner who finalized the public sale.
     * @param amount Total amount of ETH raised in the public sale.
     * @param timestamp Block timestamp when the finalization occurred.
     */
    event Finalized(address indexed creator, uint256 amount, uint256 timestamp);

    /**
     * @dev Emitted when a participant successfully claims a refund. This is typically allowed when the public sale
     * is cancelled or does not meet its funding goals.
     * @param beneficiary Address of the participant receiving the refund.
     * @param amount Amount of wei refunded.
     * @param timestamp Block timestamp when the refund occurred.
     */
    event Refund(address indexed beneficiary, uint256 amount, uint256 timestamp);

    /**
     * @dev Emitted when participants claim their purchased tokens after the public sale is finalized. 
     * @param beneficiary Address of the participant claiming tokens.
     * @param amount Amount of tokens claimed.
     * @param timestamp Block timestamp when the claim occurred.
     */
    event TokenClaim(address indexed beneficiary, uint256 amount, uint256 timestamp);

    /**
     * @dev Emitted when the public sale is cancelled by the contract owner. A cancellation may allow participants
     * to claim refunds for their contributions.
     * @param creator Address of the contract owner who cancelled the public sale.
     * @param timestamp Block timestamp when the cancellation occurred.
     */
    event Cancel(address indexed creator, uint256 timestamp);

    /**
     * @dev Allows for the deposit of public sale tokens by the owner.
     * This function is intended to be called by the public sale contract owner to
     * deposit the tokens that are to be sold during the public sale.
     * 
     * @return The amount of tokens deposited for the public sale.
     */
    function deposit() external returns (uint256);

    /**
     * @dev Finalizes the public sale, allowing for the distribution of tokens to
     * participants and the withdrawal of funds raised to the beneficiary. This
     * function is typically called after the public sale ends, assuming it meets
     * any predefined criteria such as minimum funding goals.
     * 
     * @return A boolean value indicating whether the public sale was successfully
     * finalized.
     */
    function finalize() external returns (bool);

    /**
     * @dev Cancels the public sale and enables the refund process for participants.
     * This function can be used in scenarios where the public sale does not meet
     * its goals or if the organizer decides to cancel the event for any reason.
     * 
     * @return A boolean value indicating whether the public sale was successfully
     * cancelled.
     */
    function cancel() external returns (bool);

    /**
     * @dev Allows participants to claim their purchased tokens after the public sale
     * is finalized. Participants call this function to receive the tokens they
     * are entitled to.
     * 
     * @return The amount of tokens claimed by the caller.
     */
    function claim() external returns (uint256);

    /**
     * @dev Enables participants to request a refund of their contribution if the
     * public sale is cancelled or if they are otherwise eligible for a refund
     * according to the public sale's terms.
     * 
     * @return The amount of funds refunded to the caller.
     */
    function refund() external returns (uint256);
}