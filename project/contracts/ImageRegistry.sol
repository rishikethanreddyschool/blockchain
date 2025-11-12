// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ImageRegistry {
    mapping(string => bool) private _registeredHashes;
    string[] private _hashList;

    event ImageHashRegistered(string indexed imageHash, uint256 timestamp);
    event ImageHashesRegistered(string indexed cryptographicHash, string perceptualHash, uint256 timestamp);

    function registerCryptographicHash(string memory cryptographicHash) public {
        require(!_registeredHashes[cryptographicHash], "Cryptographic hash already registered");
        _registeredHashes[cryptographicHash] = true;
        _hashList.push(cryptographicHash);
        emit ImageHashRegistered(cryptographicHash, block.timestamp);
    }

    function registerImageHashes(string memory cryptographicHash, string memory perceptualHash) public {
        require(!_registeredHashes[cryptographicHash], "Cryptographic hash already registered");
        _registeredHashes[cryptographicHash] = true;
        _hashList.push(cryptographicHash);
        emit ImageHashesRegistered(cryptographicHash, perceptualHash, block.timestamp);
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
