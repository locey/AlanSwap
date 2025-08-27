// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//引入oracle接口
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

library DataFeed {

    //获取预言机数据
    function getDataFeed(address oracleDataFeedAddress) internal view returns (int256) {
        AggregatorV3Interface dataFeed = AggregatorV3Interface(oracleDataFeedAddress);
        (
            /*uint80 roundID*/,
            int256 price,
            /*uint256 startedAt*/,
            /*uint256 timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return price;
    }
}