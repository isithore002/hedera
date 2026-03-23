// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../HieroCron.sol";

/**
 * @title AutoPayroll
 * @dev Automated payroll distribution contract using HieroCron.
 * Distributes HBAR to a list of employees at a fixed interval (e.g., weekly).
 *
 * Usage:
 * 1. Deploy with interval (604800 = weekly) and max pay periods.
 * 2. Add employees with addEmployee().
 * 3. Fund the contract with HBAR.
 * 4. Call startCron() — payroll runs autonomously.
 */
contract AutoPayroll is HieroCron {
    struct Employee {
        address payable wallet;
        uint256 salary;      // in tinybars
        bool active;
    }

    Employee[] public employees;
    uint256 public totalPayrollCost;
    uint256 public totalDistributed;
    uint256 public payPeriodCount;

    event PayrollExecuted(uint256 indexed period, uint256 totalPaid, uint256 employeeCount);
    event EmployeeAdded(address indexed wallet, uint256 salary);
    event EmployeeRemoved(address indexed wallet);

    constructor(
        uint256 _intervalSeconds,
        uint256 _maxPayPeriods
    ) HieroCron(_intervalSeconds, _maxPayPeriods) {}

    function addEmployee(address payable _wallet, uint256 _salary) external {
        employees.push(Employee(_wallet, _salary, true));
        totalPayrollCost += _salary;
        emit EmployeeAdded(_wallet, _salary);
    }

    function removeEmployee(uint256 _index) external {
        require(_index < employees.length, "Invalid index");
        Employee storage emp = employees[_index];
        require(emp.active, "Already removed");
        totalPayrollCost -= emp.salary;
        emp.active = false;
        emit EmployeeRemoved(emp.wallet);
    }

    function _executeTask() internal override {
        payPeriodCount++;
        uint256 paid = 0;
        uint256 count = 0;

        for (uint256 i = 0; i < employees.length; i++) {
            Employee storage emp = employees[i];
            if (emp.active && address(this).balance >= emp.salary) {
                emp.wallet.transfer(emp.salary);
                paid += emp.salary;
                count++;
            }
        }

        totalDistributed += paid;
        emit PayrollExecuted(payPeriodCount, paid, count);
    }

    function getEmployeeCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < employees.length; i++) {
            if (employees[i].active) count++;
        }
        return count;
    }

    receive() external payable {}
}
