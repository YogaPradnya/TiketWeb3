// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract NFTixEvent is ERC721, AccessControl {
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");

    struct EventInfo {
        string name;
        string venue;
        uint64 eventDate;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 soldTickets;
        bool saleActive;
    }

    uint256 public eventCount;
    uint256 public totalTicketsMinted;

    mapping(uint256 eventId => EventInfo info) private _events;
    mapping(uint256 tokenId => uint256 eventId) public tokenEventId;
    mapping(uint256 tokenId => bool used) public usedTicket;
    mapping(uint256 tokenId => bool locked) public lockedTicket;
    mapping(uint256 eventId => mapping(address buyer => bool owned)) public hasTicketForEvent;
    mapping(address owner => uint256[] tokenIds) private _ownedTicketIds;

    error InvalidEvent();
    error SaleClosed();
    error SoldOut();
    error IncorrectTicketPrice();
    error AlreadyHasTicket();
    error InvalidTicket();
    error TicketAlreadyUsed();
    error TicketLocked();
    error WithdrawFailed();

    event EventCreated(uint256 indexed eventId, string name, uint256 ticketPrice, uint256 maxTickets);
    event EventUpdated(uint256 indexed eventId, string name, uint256 ticketPrice, uint256 maxTickets);
    event SaleStatusChanged(uint256 indexed eventId, bool saleActive);
    event TicketPurchased(uint256 indexed eventId, uint256 indexed tokenId, address indexed buyer);
    event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId, address indexed attendee);
    event TicketLockChanged(uint256 indexed tokenId, bool locked);

    constructor() ERC721("NFTix Event Ticket", "NFTIX") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORGANIZER_ROLE, msg.sender);
    }

    function createEvent(
        string calldata name,
        string calldata venue,
        uint64 eventDate,
        uint256 ticketPrice,
        uint256 maxTickets,
        bool saleActive
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256 eventId) {
        if (ticketPrice == 0 || maxTickets == 0) revert InvalidEvent();

        unchecked {
            eventId = ++eventCount;
        }

        _events[eventId] = EventInfo({
            name: name,
            venue: venue,
            eventDate: eventDate,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            soldTickets: 0,
            saleActive: saleActive
        });

        emit EventCreated(eventId, name, ticketPrice, maxTickets);
    }

    function updateEvent(
        uint256 eventId,
        string calldata name,
        string calldata venue,
        uint64 eventDate,
        uint256 ticketPrice,
        uint256 maxTickets
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        EventInfo storage info = _events[eventId];
        if (eventId == 0 || eventId > eventCount || ticketPrice == 0 || maxTickets < info.soldTickets) {
            revert InvalidEvent();
        }

        info.name = name;
        info.venue = venue;
        info.eventDate = eventDate;
        info.ticketPrice = ticketPrice;
        info.maxTickets = maxTickets;

        emit EventUpdated(eventId, name, ticketPrice, maxTickets);
    }

    function setSaleActive(uint256 eventId, bool saleActive) external onlyRole(DEFAULT_ADMIN_ROLE) {
        EventInfo storage info = _events[eventId];
        if (eventId == 0 || eventId > eventCount) revert InvalidEvent();

        info.saleActive = saleActive;
        emit SaleStatusChanged(eventId, saleActive);
    }

    function buyTicket(uint256 eventId) external payable returns (uint256 tokenId) {
        EventInfo storage info = _events[eventId];
        if (eventId == 0 || eventId > eventCount) revert InvalidEvent();
        if (!info.saleActive) revert SaleClosed();
        if (info.soldTickets >= info.maxTickets) revert SoldOut();
        if (msg.value != info.ticketPrice) revert IncorrectTicketPrice();
        if (hasTicketForEvent[eventId][msg.sender]) revert AlreadyHasTicket();

        unchecked {
            tokenId = ++totalTicketsMinted;
            ++info.soldTickets;
        }

        hasTicketForEvent[eventId][msg.sender] = true;
        tokenEventId[tokenId] = eventId;
        lockedTicket[tokenId] = true;
        _ownedTicketIds[msg.sender].push(tokenId);
        _safeMint(msg.sender, tokenId);

        emit TicketPurchased(eventId, tokenId, msg.sender);
        emit TicketLockChanged(tokenId, true);
    }

    function setTicketLocked(uint256 tokenId, bool locked) external onlyRole(ORGANIZER_ROLE) {
        if (_ownerOf(tokenId) == address(0) || tokenEventId[tokenId] == 0) revert InvalidTicket();
        if (usedTicket[tokenId] && !locked) revert TicketAlreadyUsed();

        lockedTicket[tokenId] = locked;
        emit TicketLockChanged(tokenId, locked);
    }

    function useTicket(uint256 tokenId) external onlyRole(ORGANIZER_ROLE) {
        address attendee = ownerOf(tokenId);
        uint256 eventId = tokenEventId[tokenId];
        if (eventId == 0) revert InvalidTicket();
        if (usedTicket[tokenId]) revert TicketAlreadyUsed();

        usedTicket[tokenId] = true;
        lockedTicket[tokenId] = true;
        emit TicketUsed(tokenId, eventId, attendee);
        emit TicketLockChanged(tokenId, true);
    }

    function getEvent(uint256 eventId) external view returns (EventInfo memory) {
        if (eventId == 0 || eventId > eventCount) revert InvalidEvent();
        return _events[eventId];
    }

    function getOwnedTickets(address owner) external view returns (uint256[] memory) {
        return _ownedTicketIds[owner];
    }

    function isTicketValid(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0) && tokenEventId[tokenId] != 0 && !usedTicket[tokenId];
    }

    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        (bool success,) = payable(msg.sender).call{value: address(this).balance}("");
        if (!success) revert WithdrawFailed();
    }

    function _removeOwnedTicket(address owner, uint256 tokenId) private {
        uint256[] storage tokenIds = _ownedTicketIds[owner];
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (tokenIds[i] == tokenId) {
                tokenIds[i] = tokenIds[tokenIds.length - 1];
                tokenIds.pop();
                return;
            }
        }
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address from)
    {
        from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0)) {
            uint256 eventId = tokenEventId[tokenId];
            if (usedTicket[tokenId]) revert TicketAlreadyUsed();
            if (lockedTicket[tokenId]) revert TicketLocked();
            if (hasTicketForEvent[eventId][to]) revert AlreadyHasTicket();

            hasTicketForEvent[eventId][from] = false;
            hasTicketForEvent[eventId][to] = true;
            lockedTicket[tokenId] = true;
            _removeOwnedTicket(from, tokenId);
            _ownedTicketIds[to].push(tokenId);
            emit TicketLockChanged(tokenId, true);
        }

        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
