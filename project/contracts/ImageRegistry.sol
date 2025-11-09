// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ImageRegistry {
    mapping(string => bool) private _registeredHashes;
    string[] private _hashList;

    event ImageHashRegistered(string indexed imageHash, uint256 timestamp);

    function registerImageHash(string memory imageHash) public {
        require(!_registeredHashes[imageHash], "Hash already registered");
        _registeredHashes[imageHash] = true;
        _hashList.push(imageHash);
        emit ImageHashRegistered(imageHash, block.timestamp);
    }

    function isHashRegistered(string memory imageHash) public view returns (bool) {
        return _registeredHashes[imageHash];
    }

    function getTotalRegisteredHashes() public view returns (uint256) {
        return _hashList.length;
    }

    function getHashAtIndex(uint256 index) public view returns (string memory) {
        require(index < _hashList.length, "Index out of bounds");
        return _hashList[index];
    }
}