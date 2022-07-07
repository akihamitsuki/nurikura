import * as mc from 'mojang-minecraft';
import { Setting } from './Setting';

interface Coordinate {
  x: number;
  y: number;
  z: number;
}

interface Direction {
  readonly up: Coordinate;
  readonly down: Coordinate;
  readonly north: Coordinate;
  readonly south: Coordinate;
  readonly west: Coordinate;
  readonly east: Coordinate;
  [key: string]: Coordinate;
}

const directions: Direction = {
  up: { x: 0, y: 1, z: 0 },
  down: { x: 0, y: -1, z: 0 },
  south: { x: 0, y: 0, z: 1 },
  north: { x: 0, y: 0, z: -1 },
  east: { x: 1, y: 0, z: 0 },
  west: { x: -1, y: 0, z: 0 },
};

export class Block {
  block: mc.Block;

  constructor(block: mc.Block) {
    this.block = block;
  }

  /**
   * そのブロックは空気に触れているか
   *
   * 表面だけ塗りたいので、地中などのブロックを塗り替えないようにしたい
   */
  isExposed(): boolean {
    // あらかじめ設定しておいた向き配列で繰り返し
    for (const key in directions) {
      // その向きのブロックを取得する
      // 今回の座標を取得する
      const { x, y, z } = directions[key];
      // その座標のブロックを取得する
      const targetBlock = this.block.dimension.getBlock(this.block.location.offset(x, y, z));
      // その向きにあるブロックは空気であるか
      if (targetBlock.isEmpty) {
        // 真ならリターンして終了(今回の条件ではどこか1つだけでいい)
        return true;
      }
    }
    return false;
  }

  /**
   * 塗り替え可能判定
   */
  canPaint(): boolean {
    // (そのブロックが空気ではない) かつ (塗り替え禁止ブロックではない) かつ (露出ブロックである)
    return !this.block.isEmpty && !Setting.denyBlocks.includes(this.block.type) && this.isExposed();
  }

  getColor(): string | undefined {
    const colorProperty = this.block.permutation.getProperty(mc.BlockProperties.color) as mc.StringBlockProperty;
    if (colorProperty) {
      return colorProperty.value;
    }
    return undefined;
  }

  isSame(type: mc.BlockType): boolean {
    return this.block.id === type.id;
  }

  paint(paintBlockType: mc.BlockType, paintPermutation: mc.BlockPermutation) {
    // ブロックの種類を変更
    this.block.setType(paintBlockType);
    // ブロック内の情報を設定する（色変更）。もとの情報を変更するのではなく、新しく上書きする
    this.block.setPermutation(paintPermutation);
  }
}
