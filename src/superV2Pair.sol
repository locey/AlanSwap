// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/token/ERC20/ERC20.sol";
import "@openzeppelin/token/ERC20/IERC20.sol";
import "./libraries/Math.sol";
import "./libraries/UQ112X112.sol";

// interface IERC20 {
//     function balanceOf(address) external returns (uint256);
//     function transfer(address to, uint256 amount) external;
// }
error InsufficientLiquidityMinted();
error InsufficientLiquidityBurned();
error InsufficientOutputAmount();
error InsufficientOutputLiqudity();
error BalanceOverFlow();
error InvalidK();
error TransferFailed();
error AlreadyInitialize();

contract superV2Pair is ERC20, Math {
    using UQ112x112 for uint224;
    uint256 constant MINIMUM_LIQUIDITY = 1000;

    address public token0;
    address public token1;
    //防止而已操纵价格  112 224位用来存储储备变量 剩下的32位存储区块时间戳 防止交易前置攻击
    //这种设计可以防止在同一区块内的价格操纵攻击（如闪电贷攻击
    uint112 private reserve0;
    uint112 private reserve1;

    uint32 private blockTimestampLast;

    uint256 private price0CumulativeLast;
    uint256 private price1CumulativeLast;

    event Burn(address indexed sender, uint256 amount0, uint256 amount1);
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Sync(uint256 reserve0, uint256 reserve1);
    event Swap(
        address indexed sender,
        uint256 amount0out,
        uint256 amount1out,
        address indexed to
    );

    uint private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, "superSwap Pair:locked");
        unlocked = 0;
        _;
        unlocked = 1;
    }
    constructor() ERC20("superSwap Pair", "SSP") {}
    function initialize(address _token0, address _token1) public {
        if (token0 != address(0) || token1 != address(0))
            revert AlreadyInitialize();
        token0 = _token0;
        token1 = _token1;
    }
    // function getbalanceToken0() public view returns(uint256){
    //     return IERC20(token0).balanceOf(address(this));

    //在mint函数执行之前 流动性添加者 @已经把两个交易对合约数量发送到pair合约里@ 然后再调用mint 挖LP 给LP提供者
    function mint(address to) public lock {
        // 0 : 10 +1 / 1 : 100 + 10
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves();
        //0 :11 1:110 把总额算出来
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        //用户往这个合约里添加了多少钱/流动性计算出来
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;
        //给用户铸造多少的LP
        uint256 liquidity;
        //第一次添加比较特殊 因为同时设置了价格
        //第二次添加需要比例
        if (totalSupply() == 0) {
            //保证池子不会被抽空
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0xdead), MINIMUM_LIQUIDITY);
        } else {
            //错误的添加流动性  还是选择最小的
            liquidity = Math.min(
                (amount0 * totalSupply()) / _reserve0,
                (amount1 * totalSupply()) / _reserve1
            );
        }

        if (liquidity <= 0) revert InsufficientLiquidityMinted();

        _mint(to, liquidity);
        _update(balance0, balance1, _reserve0, _reserve1);
        emit Mint(to, amount0, amount1);
    }
    function swap(uint256 amount0out, uint256 amount1out, address to) public {
        if (amount0out == 0 && amount1out == 0)
            revert InsufficientOutputAmount();
        //getReserves() 获取当前池子的储备金 _reserve0 和 _reserve1（即上一次更新时池子里的代币数量）。
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves();
        if (amount0out > _reserve0 || amount1out > _reserve1)
            revert InsufficientOutputLiqudity();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        if (balance0 * balance1 < uint256(_reserve0) * uint256(_reserve1))
            //恒定的K值
            revert InvalidK();
        //假设用户想用100个USDT换一些ETH（假设交易对是USDT/ETH，其中token0是ETH，token1是USDT）。
        // 那么用户会调用路由器合约的某个函数，路由器会计算用户应该得到的ETH数量（比如0.5 ETH）。
        // 然后路由器会调用`swap(0.5e18, 0, userAddress)`，其中0.5e18是`amount0out`（因为token0是ETH），0表示不取出USDT，
        // userAddress是用户地址。
        _update(balance0, balance1, _reserve0, _reserve1);
        if (amount0out > 0) _safeTransfer(token0, to, amount0out);
        if (amount1out > 0) _safeTransfer(token1, to, amount1out);
        emit Swap(msg.sender, amount0out, amount1out, to);
    }
    function burn(
        address to
    ) public returns (uint256 amount0, uint256 amount1) {
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves();
        uint256 liquidity = balanceOf(address(this));

        amount0 = (liquidity * balance0) / totalSupply();
        amount1 = (liquidity * balance1) / totalSupply();

        _burn(address(this), liquidity);
        _safeTransfer(token0, to, amount0);
        _safeTransfer(token1, to, amount1);
        //把币返回后 需要更新余额
        balance0 = IERC20(token0).balanceOf(address(this));
        balance1 = IERC20(token1).balanceOf(address(this));
        _update(balance0, balance1, _reserve0, _reserve1);
        emit Burn(msg.sender, amount0, amount1);
    }

    function _safeTransfer(address token, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, value)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert TransferFailed();
        }
    }

    function getReserves() public view returns (uint112, uint112, uint32) {
        return (reserve0, reserve1, 0);
    }

    function _update(
        //balance0, balance1: 当前合约中两种代币的实际余额
        //_reserve0, _reserve1: 上一次更新时记录的储备值
        uint256 balance0,
        uint256 balance1,
        uint112 _reserve0,
        uint112 _reserve1
    ) private {
        if (balance0 > type(uint112).max || balance1 > type(uint112).max)
            revert BalanceOverFlow();
        unchecked {
            uint32 timeElapsed = uint32(block.timestamp) - blockTimestampLast;
            if (timeElapsed > 0 && _reserve0 > 0 && _reserve1 > 0) {
                price0CumulativeLast +=
                    uint256(UQ112x112.encode(_reserve0).uqdiv(_reserve0)) *
                    timeElapsed;
                price1CumulativeLast +=
                    uint256(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) *
                    timeElapsed;
            }
        }
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = uint32(block.timestamp);
        emit Sync(reserve0, reserve1);
    }
}
