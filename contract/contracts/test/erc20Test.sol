// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract erc20Test is ERC20 {
    
    constructor() ERC20("Stake Token", "STK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}