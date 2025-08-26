// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ISuperV2pair {
    function initalize(address, address) external;
    function getReserves() external returns (uint112, uint112, uint32);
    function mint(address) external returns (uint256);
}