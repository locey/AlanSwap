// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.13;

// import {Test} from "forge-std/Test.sol";
// import "../src/superV2Pair.sol";
// import "@openzeppelin/token/ERC20/ERC20.sol";

// contract ERC20mint is ERC20 {
//     constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
//     function mint(uint256 amount) public {
//         _mint(msg.sender, amount);
//     }
// }

// contract superV2PairTest is Test {
//     superV2Pair pair;
//     ERC20mint token0;
//     ERC20mint token1;
//     function setUp() public {
//         token0 = new ERC20mint("TOKEN0", "TK0");
//         token1 = new ERC20mint("TOKEN1", "TK1");
//         pair = new superV2Pair();
//         pair.initialize(address(token0), address(token1));

//         token0.mint(20 ether);
//         token1.mint(30 ether);
//     }
//     // function testMint() public {
//     //     token0.transfer(address(pair), 1 ether);
//     //     token1.transfer(address(pair), 1 ether);

//     //     pair.mint();

//     //     // assertEq(pair.balanceOf(address(this)),1 ether - 1000);
//     //     // assertEq(pair.totalSupply(),1 ether);
//     //     // assertEq(pair.name(),"superSwap Pair");
//     //     // //刚开始是0 添加完流动性后 变成1
//     //     // assertReserver(1 ether , 1 ether )
//     // }
//     function testMintWhenhaveLiquidity() public {
//         token0.transfer(address(pair), 1 ether);
//         token1.transfer(address(pair), 1 ether);
//         pair.mint();
//         assertEq(pair.balanceOf(address(this)),1 ether - 1000);

//         token0.transfer(address(pair), 2 ether);
//         token1.transfer(address(pair), 2 ether);
//         pair.mint();
//         assertEq(pair.balanceOf(address(this)),3 ether - 1000);
//     }
// }
