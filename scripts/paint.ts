import * as mc from 'mojang-minecraft';
import { ColorName } from './colors';
import { Setting } from './Setting';

/**
 * ブロックやエンティティを「塗る(paint)」処理をまとめたクラス
 */
export class Paint {
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
  public static createPaintPermutation(blockType: mc.BlockType, colorID: string): mc.BlockPermutation {
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
