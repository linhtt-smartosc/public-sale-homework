// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Error library
 * This error abstract contract provides all of the errors needed in the public sale contract.
 */
abstract contract Error {
    /**
     * @dev Enum representing the possible states of the public sale contract.
     */
    enum States {
        STARTED, 
        FORCE_FAILED, 
        FAILED,
        SUCCEEDED
    }
    /**
     * @dev Emitted when an unauthorized address attempts an action requiring specific permissions.
     */
    error Unauthorized();

    /**
     * @dev Emitted when an action is performed in an invalid state.
     * @param currentState The current state of the contract.
     */
    error InvalidState(States currentState);

    /**
     * @dev Emitted when attempting to finalize a public sale that has not reached its soft cap.
     */
    error SoftCapNotReached();

    /**
     * @dev Emitted when a purchase attempt exceeds the public sale's hard cap.
     */
    error HardCapExceed(uint256 remaining);

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
    error PurchaseLimitExceed(uint256 maxSpendPerBuyer);

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
}