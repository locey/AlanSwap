// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../interfaces/ISuperV2pair.sol";
import "../interfaces/ISuperV2Factory.sol";

library superV2Library {
    error InsufficientLiquidity();
    
    // 计算最优代币数量
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) internal pure returns (uint256 amountB) {
        if (amountA == 0) revert InsufficientLiquidity();
        if (reserveA == 0 || reserveB == 0) revert InsufficientLiquidity();
        
        amountB = (amountA * reserveB) / reserveA;
    }
    
    // 获取交易对地址
    function paidFor(
        address factory,
        address tokenA,
        address tokenB
    ) internal pure returns (address pair) {
        pair = ISuperV2Factory(factory).pairs(tokenA, tokenB);
    }
    
    // 获取交易对的储备量
    function getReserves(
        address factory,
        address tokenA,
        address tokenB
    ) internal  returns (uint256 reserveA, uint256 reserveB) {
        address pair = ISuperV2Factory(factory).pairs(tokenA, tokenB);
        if (pair == address(0)) {
            reserveA = 0;
            reserveB = 0;
        } else {
            (uint112 reserve0, uint112 reserve1, ) = ISuperV2pair(pair).getReserves();
            reserveA = reserve0;
            reserveB = reserve1;
        }
    }
}