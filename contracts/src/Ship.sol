// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import 'hardhat/console.sol';

abstract contract Ship {
  function update(uint x, uint y) public virtual;
  function fire(uint pos) public virtual returns (uint, uint);
  function place(uint width, uint height, uint pos) public virtual returns (uint, uint);
}

abstract contract Destroyer is Ship {
  uint private posX;
  uint private posY;
  uint private gameHeight;
  uint private gameWidth;
  uint private counter = 1;

  function update(uint x, uint y) public virtual override {
    console.log(' =========> Destroyer.update ', x, y);
    posX = x;
    posY = y;
  }

  function fire(uint pos) public virtual override returns (uint, uint) {
    // uint pos = rand();
    uint x = pos % gameWidth;
    uint y = pos / gameHeight;
    console.log(' =========> Destroyer.fire', pos, x, y);
    return (x, y);
  }

  function place(uint width, uint height, uint pos) public virtual override returns (uint, uint) {
    console.log(' =========> Destroyer.place ', width, height);
    gameHeight = height;
    gameWidth = width;
    posX = pos % gameWidth;
    posY = pos / gameHeight;
    return (posX, posY);
  }

  function rand() public returns (uint) {
    counter++;
    return uint(blockhash(block.number-1)) % (gameWidth * gameHeight);
    //return uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender))) % (gameWidth * gameHeight);
  }
}

abstract contract Cruiser is Ship {
  uint private posX;
  uint private posY;
  uint private gameHeight;
  uint private gameWidth;
  uint private counter = 1;


  function update(uint x, uint y) public virtual override {
    console.log(' =========> Cruiser.update ', x, y);
    posX = x;
    posY = y;
  }

  function fire(uint pos) public virtual override returns (uint, uint) {
    //uint pos = rand();
    uint x = pos % gameWidth;
    uint y = pos / gameHeight;
    console.log(' =========> Cruiser.fire', pos, x, y);
    return (x, y);
  }

  function rand() public returns (uint) {
    counter++;
    return uint(blockhash(block.number-1)) % (gameWidth * gameHeight);
    // return uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender))) % (gameWidth * gameHeight);
  }

  function place(uint width, uint height, uint pos) public virtual override returns (uint, uint) {
    console.log(' =========> Cruiser.place', pos);
    gameHeight = height;
    gameWidth = width;
    posX = pos % gameWidth;
    posY = pos / gameHeight;
    return (posX, posY);
  }
}

contract P1_Destroyer is Destroyer {}
contract P2_Destroyer is Destroyer {}
contract P1_Cruiser is Cruiser {}
contract P2_Cruiser is Cruiser {}