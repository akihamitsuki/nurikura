import * as mc from 'mojang-minecraft';
import { Block } from './Block';
import { Player } from './Player';
import { genrateRandomRangeInt } from './utilities';

/**
 * ゲームを行う領域に関する処理
 */
export class Field {
  public static mapSize = 128;

  /**
   * 次のマップの候補先へ移動する
   */
  public static teleportNext() {
    const operator = Player.getOperator();
    if (operator === undefined) {
      return;
    }

    operator.runCommand('gamemode creative');
    const x = Field.mapSize * genrateRandomRangeInt(1, 100) * 2;
    const z = Field.mapSize * genrateRandomRangeInt(1, 100) * 2;
    const location = new mc.Location(x, 128, z);
    operator.teleport(location, operator.dimension, 0, 0);
  }

  public static makeWall() {
    const operator = Player.getOperator();
    if (operator === undefined) {
      return;
    }

    // 次元（文字数を少なくしているだけ）
    const dimension = operator.dimension;
    // 中心点
    const center = Field.getCenter(operator.location);
    // ここから
    const from = new mc.Location(center.x - Field.mapSize / 2, 0, center.z - Field.mapSize / 2);
    // ここまで
    const to = new mc.Location(center.x + Field.mapSize / 2 - 1, 0, center.z + Field.mapSize / 2 - 1);
    // 4点のブロック座標を決める
    const locations = [
      new mc.BlockLocation(from.x, 0, from.z),
      new mc.BlockLocation(to.x, 0, from.z),
      new mc.BlockLocation(to.x, 0, to.z),
      new mc.BlockLocation(from.x, 0, to.z),
    ];

    // 頂点の4点に目印のガラスを積み上げる
    for (const location of locations) {
      for (let y = -63; y < 320; y += 1) {
        const block = dimension.getBlock(new mc.BlockLocation(location.x, y, location.z));
        if (block.isEmpty) {
          block.setType(mc.MinecraftBlockTypes.glass);
        }
      }
    }

    // 領域の枠に拒否ブロックを置く
    const denyHeight = -64;
    // 北西 -> 北東
    for (let x = from.x; x <= to.x; x += 1) {
      const blockLocation = new mc.BlockLocation(x, denyHeight, from.z);
      dimension.getBlock(blockLocation).setType(mc.MinecraftBlockTypes.deny);
    }
    // 南西 -> 南東
    for (let x = from.x; x <= to.x; x += 1) {
      const blockLocation = new mc.BlockLocation(x, denyHeight, to.z);
      dimension.getBlock(blockLocation).setType(mc.MinecraftBlockTypes.deny);
    }
    // 北東 -> 南東
    for (let z = from.z; z <= to.z; z += 1) {
      const blockLocation = new mc.BlockLocation(to.x, denyHeight, z);
      dimension.getBlock(blockLocation).setType(mc.MinecraftBlockTypes.deny);
    }
    // 北西 -> 南西
    for (let z = from.z; z <= to.z; z += 1) {
      const blockLocation = new mc.BlockLocation(from.x, denyHeight, z);
      dimension.getBlock(blockLocation).setType(mc.MinecraftBlockTypes.deny);
    }

    const wallHeight = 3;
    for (let x = from.x; x <= to.x; x += 1) {
      const block = new Block(operator.dimension.getBlock(new mc.BlockLocation(x, 0, from.z)));
      const highest = block.getHighestBlock();
      const loc = highest.location;
      for (let y = loc.y - 10; y < loc.y + wallHeight + 1; y += 1) {
        const b = dimension.getBlock(new mc.BlockLocation(x, y, from.z));
        if (b.isEmpty) {
          b.setType(mc.MinecraftBlockTypes.glass);
        }
      }
    }
    for (let x = from.x; x <= to.x; x += 1) {
      const block = new Block(operator.dimension.getBlock(new mc.BlockLocation(x, 0, to.z)));
      const highest = block.getHighestBlock();
      const loc = highest.location;
      for (let y = loc.y - 10; y < loc.y + wallHeight + 1; y += 1) {
        const b = dimension.getBlock(new mc.BlockLocation(x, y, to.z));
        if (b.isEmpty) {
          b.setType(mc.MinecraftBlockTypes.glass);
        }
      }
    }
    for (let z = from.z; z <= to.z; z += 1) {
      const block = new Block(operator.dimension.getBlock(new mc.BlockLocation(to.x, 0, z)));
      const highest = block.getHighestBlock();
      const loc = highest.location;
      for (let y = loc.y - 10; y < loc.y + wallHeight + 1; y += 1) {
        const b = dimension.getBlock(new mc.BlockLocation(to.x, y, z));
        if (b.isEmpty) {
          b.setType(mc.MinecraftBlockTypes.glass);
        }
      }
    }
    for (let z = from.z; z <= to.z; z += 1) {
      const block = new Block(operator.dimension.getBlock(new mc.BlockLocation(from.x, 0, z)));
      const highest = block.getHighestBlock();
      const loc = highest.location;
      for (let y = loc.y - 10; y < loc.y + wallHeight + 1; y += 1) {
        const b = dimension.getBlock(new mc.BlockLocation(from.x, y, z));
        if (b.isEmpty) {
          b.setType(mc.MinecraftBlockTypes.glass);
        }
      }
    }
  }

  /**
   * この場合の中心とは、地図が描画される範囲の中心のこと
   * この地図の描画範囲を無視すればこのような形にする必要はない
   */
  private static getCenter(location: mc.Location) {
    let x = location.x;
    const xMod = location.x % Field.mapSize;
    if (xMod < Field.mapSize / 2) {
      x -= xMod;
    } else {
      x += Field.mapSize - xMod;
    }

    let z = location.z;
    const zMod = location.z % Field.mapSize;
    if (zMod < Field.mapSize / 2) {
      z -= zMod;
    } else {
      z += Field.mapSize - zMod;
    }

    return new mc.Location(x, 0, z);
  }
}
