import * as mc from 'mojang-minecraft';
import { Block } from './Block';
import { Score } from './Score';
import { Setting } from './Setting';

/**
 * ブロックやエンティティを「塗る(paint)」処理をまとめたクラス
 */
export class Paint {
  /**
   * ブロックを塗る
   *
   * @param block
   * @param colorID
   */
  public static paintBlock(block: mc.Block, colorID: string) {
    // 半径
    const radius = 1;
    // 塗り替えるブロックの種類
    const paintBlockType = mc.MinecraftBlockTypes.wool;
    // 塗り替え先ブロックの組み合わせ情報を作成する
    const paintPermutation = Paint.createPaintPermutation(paintBlockType, colorID);
    // 塗った色を数える
    const score = new Score();

    // 各座標別に繰り返し
    for (let x = -radius; x <= radius; x += 1) {
      for (let y = -radius; y <= radius; y += 1) {
        for (let z = -radius; z <= radius; z += 1) {
          // 当たったブロックから相対的な座標を取得する
          const targetLocation = block.location.offset(x, y, z);
          // その座標のブロックを取得する
          const targetBlock = new Block(block.dimension.getBlock(targetLocation));
          // そのブロックが塗り替え可能ならば
          if (targetBlock.canPaint()) {
            // 対象のブロック同じ種類のブロックなら
            if (targetBlock.isSame(paintBlockType)) {
              // 塗られて消えるブロックなので、その色の数を減らす
              score.add(targetBlock.getColor(), -1);
            }
            // 対象ブロックを塗る
            targetBlock.paint(paintBlockType, paintPermutation);
            // 塗ったブロックなので、その色の数を増やす
            score.add(colorID, 1);
          }
        }
      }
    }

    // 塗り替えた色の数を保存する
    score.save();
  }

  /**
   * 羊に色を塗る
   *
   * @param entity
   * @param colorID
   * @returns
   */
  public static paintSheep(entity: mc.Entity, colorID: string) {
    // 対象が羊であるか
    if (entity.id !== mc.MinecraftEntityTypes.sheep.id) {
      return;
    }
    // 色コンポーネントを持っているか（羊なら持っているはずだが一応）
    if (!entity.hasComponent('minecraft:color')) {
      return;
    }
    // 設定から色情報を取得する
    const color = Setting.colors.find((v) => v.id === colorID);
    if (color) {
      // 色コンポーネントを取得して、値を変更
      const colorComponent = entity.getComponent('minecraft:color') as mc.EntityColorComponent;
      // 色を設定する（この場合は規定の数字）
      colorComponent.value = color.data;
    }
  }

  /**
   * ブロック情報を作成
   *
   * @param blockType
   * @param colorID
   * @returns
   */
  private static createPaintPermutation(blockType: mc.BlockType, colorID: string): mc.BlockPermutation {
    // そのブロックのブロック情報を作成する（空ではなく、そのブロックの初期値が含まれている）
    const permutation = blockType.createDefaultBlockPermutation();
    // 色プロパティを取得する
    const colorProperty = permutation.getProperty(mc.BlockProperties.color) as mc.StringBlockProperty;
    // 色を設定する（この場合は規定の色名）
    colorProperty.value = colorID;
    // 順列情報を返す
    return permutation;
  }
}
