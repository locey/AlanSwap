
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


/**
 * @title CryptoSwap Token
 * @dev ERC20代币合约，用于CryptoSwap项目
 */
contract CSWAPToken is ERC20 ,Ownable, Pausable, ReentrancyGuard{

    // 代币小数位（通常为18）
    uint8 private constant _DECIMALS = 18;
    
    // 增发事件，便于前端追踪代币供应变化
    event TokensMinted(address indexed to, uint256 amount);
    event BatchTokensMinted(address indexed operator, uint256 totalAmount);

    /**
     * @dev 构造函数
     * @param initialSupply 初始供应量（不带小数位，合约内部会自动乘以10^decimals）
     */
    constructor(uint256 initialSupply) ERC20("CryptoSwap Token", "CSWAP") {
        require(initialSupply > 0, "Initial supply must be positive");
        uint256 supplyWithDecimals = initialSupply * (10 ** uint256(_DECIMALS));
        _mint(msg.sender, supplyWithDecimals);
    }

    /**
     * @dev 重写decimals函数，固定返回18位小数
     */
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /**
     * @dev 增发代币（仅所有者可调用）
     * @param to 接收地址
     * @param amount 增发数量（不带小数位，合约内部会自动乘以10^decimals）
     */
    function mint(address to, uint256 amount) external onlyOwner whenNotPaused nonReentrant {
        require(to != address(0), "Recipient cannot be zero address");
        require(amount > 0, "Mint amount must be positive");
        
        uint256 amountWithDecimals = amount * (10 ** uint256(_DECIMALS));
        _mint(to, amountWithDecimals);
        
        emit TokensMinted(to, amountWithDecimals);
    }

    /**
     * @dev 批量增发代币（仅所有者可调用）
     * @param recipients 接收地址数组
     * @param amounts 增发数量数组（每个元素对应一个接收地址，不带小数位）
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        onlyOwner 
        whenNotPaused 
        nonReentrant 
    {
        require(recipients.length > 0, "Recipients array cannot be empty");
        require(recipients.length == amounts.length, "Recipients and amounts length mismatch");
        
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Recipient cannot be zero address");
            require(amounts[i] > 0, "Mint amount must be positive");
            
            uint256 amountWithDecimals = amounts[i] * (10 ** uint256(_DECIMALS));
            _mint(recipients[i], amountWithDecimals);
            totalAmount += amountWithDecimals;
            
            emit TokensMinted(recipients[i], amountWithDecimals);
        }
        
        emit BatchTokensMinted(msg.sender, totalAmount);
    }

    /**
     * @dev 暂停代币转账（紧急情况使用，仅所有者可调用）
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 恢复代币转账（仅所有者可调用）
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev 重写转账函数，加入暂停控制
     */
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }

    /**
     * @dev 重写授权转账函数，加入暂停控制
     */
    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}