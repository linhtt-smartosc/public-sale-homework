// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * This interface outlines the functions related to managing and interacting
 * with public sale contracts. It includes capabilities such as depositing funds,
 * finalizing the public sale, canceling the public sale, claiming tokens, and refunding
 * contributions. Implementing contracts should provide the logic for these
 * operations in the context of a public sale event.
 */
interface IPublicSale {
    
    /**
     * @dev Allows for the deposit of public sale tokens by the owner.
     * This function is intended to be called by the public sale contract owner to
     * deposit the tokens that are to be sold during the public sale.
     * 
     * @param amount Amount of tokens that the owner wants to deposit.
     */
    function deposit(uint256 amount) external payable;

    /**
     * @dev Cancels the public sale and enables the refund process for participants.
     * This function can be used in scenarios where the public sale does not meet
     * its goals or if the organizer decides to cancel the event for any reason.
     */
    function cancel() external;

    /**
     * @dev Allows participants to claim their purchased tokens after the public sale
     * is finalized. Participants call this function to receive the tokens they
     * are entitled to.
     */
    function claim() external;

    /**
     * @dev Enables participants to request a refund of their contribution if the
     * public sale is cancelled or if they are otherwise eligible for a refund
     * according to the public sale's terms.
     */
    function refund() external;

    /**
     * @dev Enables participants to purchase tokens during the public sale event.
     * This function is typically called by participants to contribute funds and
     * receive tokens in return.
     * 
     * @param amount Amount of base tokens that the participant wants to deposit to purchase tokens.
     * @notice The function should revert if the public sale is not active or if the
     * participant's contribution exceeds the maximum allowed per buyer.
     */
    function purchase(uint256 amount) external;

}