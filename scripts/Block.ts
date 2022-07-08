import * as mc from 'mojang-minecraft';
import { ColorName } from './colors';
import { Paint } from './Paint';
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

/**
 * ブロック(block)に関する処理をまとめたクラス
 */
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

  /**
   * そのブロックの色名を取得する
   */
  getColor(): ColorName | undefined {
    const colorProperty = this.block.permutation.getProperty(mc.BlockProperties.color) as mc.StringBlockProperty;
    if (colorProperty) {
      return colorProperty.value as ColorName;
    }

    return undefined;
  }

  /**
   * そのブロックは比較ブロックと同じ種類であるか（データ値の違いまでは考慮しない）
   *
   * @param type 対象ブロックの種類
   * @returns 同じ種類なら真
   */
  isSame(type: mc.BlockType): boolean {
    return this.block.id === type.id;
  }

  /**
   * そのブロックを指定の色で塗る
   *
   * @param paintBlockType
   * @param colorID
   */
  paint(paintBlockType: mc.BlockType, colorID: ColorName) {
    // ブロックの種類を変更
    this.block.setType(paintBlockType);
    // 塗り替え先ブロックの組み合わせ情報を作成する
    const paintPermutation = Paint.createPaintPermutation(paintBlockType, colorID);
    // ブロック内の情報を設定する（色変更）。もとの情報を変更するのではなく、新しく上書きする
    this.block.setPermutation(paintPermutation);
  }

  /**
   * 塗る対象となるブロック
   *
   * @param radius 半径
   * @returns
   */
  getAroundBlocks(radius: number): Block[] {
    const blocks: Block[] = [];

    for (let x = -radius; x <= radius; x += 1) {
      for (let y = -radius; y <= radius; y += 1) {
        for (let z = -radius; z <= radius; z += 1) {
          // 当たったブロックから相対的な座標を取得する
          const location = this.block.location.offset(x, y, z);
          // その座標のブロックを取得する
          const block = new Block(this.block.dimension.getBlock(location));
          // そのブロックが塗り替え可能ならば
          if (block.canPaint()) {
            blocks.push(block);
          }
        }
      }
    }

    return blocks;
  }
}
