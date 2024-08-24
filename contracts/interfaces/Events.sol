// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

abstract contract Events {
    /**
     * @dev Emitted when a new ERC20 token contract is created by the factory.
     * @param token Address of the ERC20 contract created
     */
    event ERC20TokenCreated(address indexed token);
    /**
     * @dev Emitted when a new public sale contract is created by the factory.
     * @param publicSale Address of the public sale contract created.
     */
    event PublicSaleCreated(address indexed publicSale);

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
     * @dev Emitted when a participant successfully claims a refund. This is typically allowed when the public sale
     * is cancelled or does not meet its funding goals.
     * @param beneficiary Address of the participant receiving the refund.
     * @param amount Amount of wei refunded.
     * @param timestamp Block timestamp when the refund occurred.
     */
    event Refund(
        address indexed beneficiary,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev Emitted when participants claim their purchased tokens after the public sale is finalized.
     * @param beneficiary Address of the participant claiming tokens.
     * @param amount Amount of tokens claimed.
     * @param timestamp Block timestamp when the claim occurred.
     */
    event TokenClaimed(
        address indexed beneficiary,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev Emitted when the public sale is cancelled by the contract owner. A cancellation may allow participants
     * to claim refunds for their contributions.
     * @param owner Address of the contract owner who cancelled the public sale.
     * @param timestamp Block timestamp when the cancellation occurred.
     */
    event Cancel(address owner, uint256 timestamp);
}
