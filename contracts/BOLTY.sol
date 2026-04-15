// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BOLTY Token
 * @dev BOLTY is the native utility token of Bolty AI Agent Marketplace
 * Contract deployed on Base blockchain
 *
 * Tokenomics:
 * - Total Supply: 1,000,000,000 BOLTY (1 billion)
 * - Decimals: 18
 * - Used for: Agent boosting, trending visibility
 */
contract BOLTY is ERC20, ERC20Burnable, Ownable {

    // Addresses
    mapping(address => bool) public raysMinters; // Contracts that can trigger ray burning

    // Events
    event RaysBurned(address indexed agent, address indexed creator, uint256 amount);
    event RaysMinterAdded(address indexed minter);
    event RaysMinterRemoved(address indexed minter);

    constructor() ERC20("BOLTY", "BOLTY") {
        // Initial supply: 1 billion tokens
        _mint(msg.sender, 1_000_000_000 * 10 ** decimals());
    }

    /**
     * Add contract that can trigger ray burning (Bolty backend)
     */
    function addRaysMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid address");
        raysMinters[minter] = true;
        emit RaysMinterAdded(minter);
    }

    /**
     * Remove rays minter
     */
    function removeRaysMinter(address minter) external onlyOwner {
        raysMinters[minter] = false;
        emit RaysMinterRemoved(minter);
    }

    /**
     * Burn tokens when rays are purchased
     * 50% burn, 50% to owner (Bolty DAO)
     *
     * @param from User's address who is buying rays
     * @param agentId Agent ID getting the boost
     * @param amount Total BOLTY amount
     */
    function burnRays(
        address from,
        string memory agentId,
        uint256 amount
    ) external {
        require(raysMinters[msg.sender], "Only authorized minters can burn rays");
        require(from != address(0), "Invalid address");
        require(amount > 0, "Amount must be greater than 0");

        // Calculate burn and treasury amounts
        uint256 burnAmount = (amount * 50) / 100;  // 50% burn
        uint256 treasuryAmount = amount - burnAmount; // 50% to owner

        // Transfer from user to this contract (user must approve first)
        transferFrom(from, address(this), amount);

        // Burn the burn amount
        _burn(address(this), burnAmount);

        // Transfer treasury amount to owner
        _transfer(address(this), owner(), treasuryAmount);

        emit RaysBurned(msg.sender, from, amount);
    }

    /**
     * Allow owner to withdraw any accumulated tokens
     */
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(balanceOf(address(this)) >= amount, "Insufficient balance");
        _transfer(address(this), owner(), amount);
    }

    /**
     * Get total burned tokens (supply reduction)
     */
    function getTotalBurned() external view returns (uint256) {
        // Initial supply - current supply
        return (1_000_000_000 * 10 ** decimals()) - totalSupply();
    }
}
