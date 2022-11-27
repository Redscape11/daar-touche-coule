// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./Ship.sol";
import "hardhat/console.sol";

struct Game {
  uint256 height;
  uint256 width;
  mapping(uint256 => mapping(uint256 => uint256)) board;
  mapping(uint256 => int256) xs;
  mapping(uint256 => int256) ys;
}

contract Main {
  Game private game;
  uint256 private index;
  mapping(address => bool) private used;
  mapping(uint256 => address) private ships;
  mapping(uint256 => address) private owners;
  mapping(address => uint256) private count;

  event Size(uint256 width, uint256 height);
  event Touched(uint256 ship, uint256 x, uint256 y);
  event Registered(
    uint256 indexed index,
    address indexed owner,
    uint256 x,
    uint256 y
  );

  constructor() {
    console.log(" ====> Main.constructor");
    game.width = 50;
    game.height = 50;
    index = 1;
    emit Size(game.width, game.height);
  }

  function register(address shipAddr, uint256 pos) external {
    console.log(" ====> Main.register", pos, shipAddr);
    require(count[msg.sender] < 2, "Only two ships");
    require(!used[shipAddr], "Ship already on the board");
    require(index <= game.height * game.width, "Too much ship on board");
    count[msg.sender] += 1;
    ships[index] = shipAddr;
    owners[index] = msg.sender;
    (uint256 x, uint256 y) = placeShip(index, pos);
    Ship(ships[index]).update(x, y);
    emit Registered(index, msg.sender, x, y);
    used[shipAddr] = true;
    index += 1;
  }

  function turn(uint[] memory pos) external {
    console.log(" ====> Main.turn");
    bool[] memory touched = new bool[](index);
    for (uint256 i = 1; i < index; i++) {
      if (game.xs[i] < 0) continue;
      Ship ship = Ship(ships[i]);
      (uint256 x, uint256 y) = ship.fire(pos[i-1]);
      if (game.board[x][y] > 0) {
        touched[game.board[x][y]] = true;
      }
    }
    for (uint256 i = 0; i < index; i++) {
      if (touched[i]) {
        emit Touched(i, uint256(game.xs[i]), uint256(game.ys[i]));
        game.xs[i] = -1;
      }
    }
  }

  function placeShip(uint256 idx, uint256 pos) internal returns (uint256, uint256) {
    console.log(" ====> Main.placeShip");
    Ship ship = Ship(ships[idx]);
    (uint256 x, uint256 y) = ship.place(game.width, game.height,pos);
    bool invalid = true;
    while (invalid) {
      if (game.board[x][y] == 0) {
        game.board[x][y] = idx;
        game.xs[idx] = int256(x);
        game.ys[idx] = int256(y);
        invalid = false;
      } else {
        uint256 newPlace = (x * game.width) + y + 1;
        x = newPlace % game.width;
        y = (newPlace / game.width) % game.height;
      }
    }
    return (x, y);
  }

  receive() external payable {} // to support receiving ETH by default

  fallback() external payable {}
}
