// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract LiveCounter {
    uint256 public value;

    event Incremented(uint256 newValue, address indexed by);

    function increment() external {
        value += 1;
        emit Incremented(value, msg.sender);
    }
}
