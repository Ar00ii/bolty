// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BoltyEscrow
 * @notice Holds ETH in escrow for marketplace purchases.
 *
 *  Flow:
 *    1. Buyer calls deposit(orderId, seller) with ETH.
 *    2. Seller delivers off-chain; buyer calls release(orderId).
 *    3. Contract sends 97.5 % to seller + 2.5 % to platform.
 *    4. Either party can dispute(); admin resolves via resolve().
 *    5. Auto-release after RELEASE_TIMEOUT if no dispute.
 */
contract BoltyEscrow {
    // ─── State ──────────────────────────────────────────────────────────
    address public admin;
    address public platformWallet;
    uint256 public constant PLATFORM_FEE_BPS = 600; // 6%
    uint256 public constant RELEASE_TIMEOUT  = 14 days;

    enum Status { NONE, FUNDED, RELEASED, DISPUTED, RESOLVED, REFUNDED }

    struct Order {
        address buyer;
        address seller;
        uint256 amount;      // total wei deposited
        uint256 createdAt;
        Status  status;
    }

    mapping(string => Order) public orders; // orderId (cuid from DB) → Order

    // ─── Events ─────────────────────────────────────────────────────────
    event Deposited(string indexed orderId, address buyer, address seller, uint256 amount);
    event Released(string indexed orderId, address seller, uint256 sellerAmount, uint256 platformFee);
    event Disputed(string indexed orderId, address disputedBy);
    event Resolved(string indexed orderId, bool refundedBuyer, uint256 amount);

    // ─── Modifiers ──────────────────────────────────────────────────────
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    // ─── Constructor ────────────────────────────────────────────────────
    constructor(address _platformWallet) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        admin = msg.sender;
        platformWallet = _platformWallet;
    }

    // ─── Core functions ─────────────────────────────────────────────────

    /**
     * @notice Buyer deposits ETH for a specific order.
     * @param orderId  The platform order ID (cuid string).
     * @param seller   The seller's wallet address.
     */
    function deposit(string calldata orderId, address seller) external payable {
        require(msg.value > 0, "Must send ETH");
        require(seller != address(0), "Invalid seller");
        require(seller != msg.sender, "Cannot escrow to yourself");
        require(orders[orderId].status == Status.NONE, "Order already exists");

        orders[orderId] = Order({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            createdAt: block.timestamp,
            status: Status.FUNDED
        });

        emit Deposited(orderId, msg.sender, seller, msg.value);
    }

    /**
     * @notice Buyer releases funds to seller (confirms delivery).
     *         Also callable by anyone after RELEASE_TIMEOUT with no dispute.
     */
    function release(string calldata orderId) external {
        Order storage o = orders[orderId];
        require(o.status == Status.FUNDED, "Not in funded state");
        require(
            msg.sender == o.buyer ||
            block.timestamp >= o.createdAt + RELEASE_TIMEOUT,
            "Only buyer or after timeout"
        );

        o.status = Status.RELEASED;

        uint256 platformFee = (o.amount * PLATFORM_FEE_BPS) / 10000;
        uint256 sellerAmount = o.amount - platformFee;

        (bool s1,) = o.seller.call{value: sellerAmount}("");
        require(s1, "Seller transfer failed");

        if (platformFee > 0) {
            (bool s2,) = platformWallet.call{value: platformFee}("");
            require(s2, "Platform transfer failed");
        }

        emit Released(orderId, o.seller, sellerAmount, platformFee);
    }

    /**
     * @notice Either buyer or seller can open a dispute.
     */
    function dispute(string calldata orderId) external {
        Order storage o = orders[orderId];
        require(o.status == Status.FUNDED, "Not in funded state");
        require(msg.sender == o.buyer || msg.sender == o.seller, "Not a party");

        o.status = Status.DISPUTED;
        emit Disputed(orderId, msg.sender);
    }

    /**
     * @notice Admin resolves a dispute: refund buyer OR pay seller.
     * @param refundBuyer  true → full refund to buyer. false → pay seller (minus fee).
     */
    function resolve(string calldata orderId, bool refundBuyer) external onlyAdmin {
        Order storage o = orders[orderId];
        require(o.status == Status.DISPUTED, "Not in disputed state");

        if (refundBuyer) {
            o.status = Status.REFUNDED;
            (bool ok,) = o.buyer.call{value: o.amount}("");
            require(ok, "Refund failed");
            emit Resolved(orderId, true, o.amount);
        } else {
            o.status = Status.RESOLVED;
            uint256 platformFee = (o.amount * PLATFORM_FEE_BPS) / 10000;
            uint256 sellerAmount = o.amount - platformFee;

            (bool s1,) = o.seller.call{value: sellerAmount}("");
            require(s1, "Seller transfer failed");
            if (platformFee > 0) {
                (bool s2,) = platformWallet.call{value: platformFee}("");
                require(s2, "Platform transfer failed");
            }
            emit Resolved(orderId, false, sellerAmount);
        }
    }

    // ─── View helpers ───────────────────────────────────────────────────

    function getOrder(string calldata orderId)
        external view
        returns (address buyer, address seller, uint256 amount, uint256 createdAt, Status status)
    {
        Order storage o = orders[orderId];
        return (o.buyer, o.seller, o.amount, o.createdAt, o.status);
    }

    function isReleasable(string calldata orderId) external view returns (bool) {
        Order storage o = orders[orderId];
        return o.status == Status.FUNDED && block.timestamp >= o.createdAt + RELEASE_TIMEOUT;
    }

    // ─── Admin ──────────────────────────────────────────────────────────

    function updateAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid address");
        admin = newAdmin;
    }

    function updatePlatformWallet(address newWallet) external onlyAdmin {
        require(newWallet != address(0), "Invalid address");
        platformWallet = newWallet;
    }
}
