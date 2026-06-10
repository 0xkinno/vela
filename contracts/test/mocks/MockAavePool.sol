// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockAavePool {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    mapping(address => uint256) public deposits;

    constructor(address _token) {
        token = IERC20(_token);
    }

    function supply(address asset, uint256 amount, address onBehalfOf, uint16) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        deposits[onBehalfOf] += amount;
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        uint256 bal = deposits[msg.sender];
        uint256 actual = amount > bal ? bal : amount;
        // Simulate 0.1% yield
        uint256 withYield = actual + (actual / 1000);
        deposits[msg.sender] -= actual;
        IERC20(asset).safeTransfer(to, withYield);
        return withYield;
    }

    function getReserveData(address) external pure returns (
        uint256, uint128, uint128, uint128, uint128,
        uint128, uint40, uint16, address, address, address, address, uint128, uint128, uint128
    ) {
        // Return 4% APY as currentLiquidityRate (ray units: 1e27)
        uint128 rate = 40000000000000000000000000; // 4% in ray
        return (0, 1e27, rate, 1e27, 0, 0, 0, 0,
                address(0), address(0), address(0), address(0), 0, 0, 0);
    }
}