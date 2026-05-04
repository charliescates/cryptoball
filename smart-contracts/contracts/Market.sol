// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./Academy.sol";

interface IPlayerToken is IERC721 {
    function transfer(address from, address to, uint256 tokenId) external;
}

contract Market is ReentrancyGuard {
    mapping(address => uint256) public pendingWithdrawals;
    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;

    address public playerTokenAddress;
    Academy public academy;

    uint256 public constant BUY_NOW_FEE_BPS = 200; // 2%
    uint256 public constant BID_FEE_BPS = 100;     // 1%

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 buyNowPrice;
        uint256 minBid;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }

    event Listed(uint256 listingId, address seller, uint256 tokenId, uint256 buyNowPrice, uint256 minBid);
    event BoughtNow(uint256 listingId, address buyer, uint256 price);
    event BidPlaced(uint256 listingId, address bidder, uint256 amount);
    event Finalized(uint256 listingId, address winner, uint256 amount);

    constructor(address _playerTokenAddress, address _academyAddress) {
        playerTokenAddress = _playerTokenAddress;
        academy = Academy(_academyAddress);
    }

    function createListing(uint256 tokenId, uint256 buyNowPrice, uint256 minBid, uint256 duration) external {
        require(buyNowPrice > 0, "Buy now price must be > 0");
        require(minBid < buyNowPrice, "Min bid must be less than buy now price");
        IPlayerToken(playerTokenAddress).transfer(msg.sender, address(this), tokenId);

        listings[listingCount] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            buyNowPrice: buyNowPrice,
            minBid: minBid,
            highestBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            active: true
        });

        emit Listed(listingCount, msg.sender, tokenId, buyNowPrice, minBid);
        listingCount++;
    }

    function buyNow(uint256 listingId) payable external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Not active");
        require(block.timestamp < listing.endTime, "Auction ended");
        require(msg.value >= listing.buyNowPrice, "Insufficient funds");

        listing.active = false;

        refundHighestBidder(listing);

        uint256 fee = (msg.value * BUY_NOW_FEE_BPS) / 10000;
        academy.deposit{value: fee}();
        pendingWithdrawals[listing.seller] += msg.value - fee;
        IPlayerToken(playerTokenAddress).transfer(address(this), msg.sender, listing.tokenId);

        emit BoughtNow(listingId, msg.sender, msg.value);
    }

    function placeBid(uint256 listingId) payable external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Not active");
        require(block.timestamp < listing.endTime, "Auction ended");
        uint256 floor = listing.highestBid > 0 ? listing.highestBid : listing.minBid;
        require(msg.value >= floor, "Bid below minimum");
        require(msg.value < listing.buyNowPrice, "Bid meets buy now price, use buyNow");

        refundHighestBidder(listing);

        listing.highestBid = msg.value;
        listing.highestBidder = msg.sender;

        emit BidPlaced(listingId, msg.sender, msg.value);
    }

    function finalize(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Not active");
        require(block.timestamp >= listing.endTime, "Auction not ended");

        listing.active = false;

        if (listing.highestBidder != address(0)) {
            settleWinner(listingId, listing);
        } else {
            returnToSeller(listingId, listing);
        }
    }

    function withdraw() public nonReentrant {
        uint amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function refundHighestBidder(Listing storage listing) private {
        if (listing.highestBidder != address(0)) {
            pendingWithdrawals[listing.highestBidder] += listing.highestBid;
        }
    }

    function settleWinner(uint256 listingId, Listing storage listing) private {
        uint256 fee = (listing.highestBid * BID_FEE_BPS) / 10000;
        academy.deposit{value: fee}();
        pendingWithdrawals[listing.seller] += listing.highestBid - fee;
        IPlayerToken(playerTokenAddress).transfer(address(this), listing.highestBidder, listing.tokenId);
        emit Finalized(listingId, listing.highestBidder, listing.highestBid);
    }

    function returnToSeller(uint256 listingId, Listing storage listing) private {
        IPlayerToken(playerTokenAddress).transfer(address(this), listing.seller, listing.tokenId);
        emit Finalized(listingId, listing.seller, 0);
    }
}