import * as mc from 'mojang-minecraft';
import { Block } from './Block';
import { genrateRandomRangeInt } from './utilities';

/**
 * ゲームを行う領域に関する処理
 */
export class Field {
  public static mapSize = 128;
  private dimension: mc.Dimension;
  private from: mc.Location;
  private to: mc.Location;

  constructor(player: mc.Player) {
    this.dimension = player.dimension;
    // 中心点
    const center = this.getCenter(player.location);
    // ここから
    this.from = new mc.Location(center.x - Field.mapSize / 2, 0, center.z - Field.mapSize / 2);
    // ここまで
    this.to = new mc.Location(center.x + Field.mapSize / 2 - 1, 0, center.z + Field.mapSize / 2 - 1);
  }

  /**
   * 次のマップの候補先へ移動する
   */
  public static teleportNext(player: mc.Player) {
    // 移動前にクリエイティブモードに変更
    player.runCommand('gamemode creative');
    // ランダムな箇所に移動
    const x = Field.mapSize * genrateRandomRangeInt(1, 100) * 2;
    const z = Field.mapSize * genrateRandomRangeInt(1, 100) * 2;
    const location = new mc.Location(x, 128, z);
    player.teleport(location, player.dimension, 0, 0);
  }

  /**
   * 対戦場用のブロックを置く
   */
  makeField() {
    // 頂点の4点に目印のガラスを積み上げる
    this.makePole();
    // 4辺に境界線を作る
    this.makeBorder();
  }

  /**
   * 壁の高さを取得する
   *
   * @param blockLocation
   * @returns
   */
  private getWallHeight(blockLocation: mc.BlockLocation): number {
    const wallHeight = 4;
    const location = this.dimension.getBlock(blockLocation);
    const block = new Block(location);
    const highest = block.getHighestBlock();
    // 「(最も高いブロック)または(水面座標)の高いほう」に壁の高さを足す
    return Math.max(highest.location.y, 64) + wallHeight;
  }

  /**
   * その(x,z)の位置に壁用ブロックを積み上げる
   *
   * @param x
   * @param z
   */
  private setWall(x: number, z: number) {
    // 一番下に拒否ブロックを置く
    {
      const block = this.dimension.getBlock(new mc.BlockLocation(x, -64, z));
      block.setType(mc.MinecraftBlockTypes.deny);
    }
    // 壁の高さまで壁ブロックを積み上げる
    const hight = this.getWallHeight(new mc.BlockLocation(x, 0, z));
    for (let y = -63; y < hight; y += 1) {
      const block = this.dimension.getBlock(new mc.BlockLocation(x, y, z));
      if (block.isEmpty) {
        block.setType(mc.MinecraftBlockTypes.glass);
      }
    }
    // 残りを上限までバリアブロックを積み上げる
    for (let y = hight; y < 320; y += 1) {
      const block = this.dimension.getBlock(new mc.BlockLocation(x, y, z));
      block.setType(mc.MinecraftBlockTypes.barrier);
    }
  }

  /**
   * 境界線を作る
   */
  private makeBorder() {
    // 北西 -> 北東
    for (let x = this.from.x; x <= this.to.x; x += 1) {
      this.setWall(x, this.from.z);
    }
    // 南西 -> 南東
    for (let x = this.from.x; x <= this.to.x; x += 1) {
      this.setWall(x, this.to.z);
    }
    // 北東 -> 南東
    for (let z = this.from.z; z <= this.to.z; z += 1) {
      this.setWall(this.to.x, z);
    }
    // 北西 -> 南西
    for (let z = this.from.z; z <= this.to.z; z += 1) {
      this.setWall(this.from.x, z);
    }
  }

  /**
   * この場合の中心とは、地図が描画される範囲の中心のこと
   * この地図の描画範囲を無視すればこのような形にする必要はない
   */
  private getCenter(location: mc.Location) {
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

  /**
   * 各頂点に目印のブロックを積み上げる
   */
  private makePole() {
    // 4点のブロック座標を決める
    const corners = [
      new mc.BlockLocation(this.from.x, 0, this.from.z),
      new mc.BlockLocation(this.to.x, 0, this.from.z),
      new mc.BlockLocation(this.to.x, 0, this.to.z),
      new mc.BlockLocation(this.from.x, 0, this.to.z),
    ];

    for (const direction in corners) {
      const location = corners[direction];
      for (let y = -63; y < 320; y += 1) {
        const blockLocaton = new mc.BlockLocation(location.x, y, location.z);
        const block = this.dimension.getBlock(blockLocaton);
        if (block.isEmpty) {
          block.setType(mc.MinecraftBlockTypes.glass);
        }
      }
    }
  }
}
