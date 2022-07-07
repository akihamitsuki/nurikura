import * as mc from 'mojang-minecraft';
import * as mcui from 'mojang-minecraft-ui';
import { Block } from './Block';
import { Player } from './Player';
import { Score } from './Score';
import { Setting } from './Setting';

export function setColor(event: mc.BeforeItemUseEvent): void {
  // 使用したアイテムが特定のアイテム以外なら処理を終了 -> 特定のアイテムを使用した場合だけ次の処理へ
  // ここでは羽根(feather)を使用した場合だけ有効
  if (event.item.id !== mc.MinecraftItemTypes.feather.id) {
    return;
  }

  // フォームのインスタンスを作成
  const actionForm = new mcui.ActionFormData();
  // 題名を追加
  actionForm.title('色選択');
  // 設問を追加
  actionForm.body('塗る色を選択してください。');
  // 選択肢を追加（追加順が、そのまま並び順になる
  for (const color of Setting.colors) {
    actionForm.button(color.name);
  }

  // イベントからプレイヤーを取得する
  const player = new Player(event.source as mc.Player);
  // フォームを表示(show)し、入力後(then)の処理を続けて書く
  actionForm.show(player.player).then((response) => {
    player.clearColorTag();
    player.setColorTag(response.selection);
  });

  // アイテムの使用を取り消す
  event.cancel = true;
}

// interface ColorCount {
//   color: string;
//   count: number;
// }

// function getColorCountObject() {
//   const colorCount: ColorCount[] = [];
//   for (const setting of colorSetting) {
//     colorCount.push({
//       color: setting.id,
//       count: 0,
//     });
//   }
//   return colorCount;
// }

function getPaintPermutation(paintBlockType: mc.BlockType, colorName: string): mc.BlockPermutation {
  const paintPermutation = paintBlockType.createDefaultBlockPermutation();
  // 色プロパティを取得する
  const colorProperty = paintPermutation.getProperty(mc.BlockProperties.color) as mc.StringBlockProperty;
  // 色を設定する
  colorProperty.value = colorName;
  // 順列情報を返す
  return paintPermutation;
}

/**
 * 発射物が当たった時のイベント
 *
 * @param event
 * @returns
 */
export function projectileHit(event: mc.ProjectileHitEvent) {
  // 発射したエンティティ
  const shooter = event.source;
  if (shooter.id !== mc.MinecraftEntityTypes.player.id) {
    return;
  }
  // 当たった発射物
  const projectile = event.projectile;
  if (projectile.id !== mc.MinecraftEntityTypes.snowball.id) {
    return;
  }

  // ブロックに当たっていれば
  const hitBlock: mc.BlockHitInformation = event.blockHit;
  if (hitBlock !== undefined) {
    // プレイヤーのタグから色を取得する
    const colorName = new Player(shooter as mc.Player).getColorName();
    // プレイヤーが色情報を持っていなければ終了
    if (!colorName) {
      return;
    }

    // 半径
    const radius = 1;
    // 塗り替えるブロックの種類
    const paintBlockType = mc.MinecraftBlockTypes.wool;
    // 塗り替え先ブロックの組み合わせ情報を作成する
    const paintPermutation = getPaintPermutation(paintBlockType, colorName);
    // 塗った色を数える
    const score = new Score();

    // 各座標別に繰り返し
    for (let x = -radius; x <= radius; x += 1) {
      for (let y = -radius; y <= radius; y += 1) {
        for (let z = -radius; z <= radius; z += 1) {
          // 当たったブロックから相対的な座標を取得する
          const targetLocation = hitBlock.block.location.offset(x, y, z);
          // その座標のブロックを取得する
          const targetBlock = new Block(event.dimension.getBlock(targetLocation));
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
            score.add(colorName, 1);
          }
        }
      }
    }

    // 塗り替えた色の数を保存する
    score.save();
  }

  // 羊だったら色を変える
  const hitEntity: mc.EntityHitInformation = event.entityHit;
  if (hitEntity !== undefined) {
    const entity = hitEntity.entity;
    // 対象が羊であるか
    if (hitEntity.entity.id !== mc.MinecraftEntityTypes.sheep.id) {
      return;
    }
    // 色コンポーネントを持っているか
    if (!entity.hasComponent('minecraft:color')) {
      return;
    }
    // プレイヤーから色情報を取得できるか
    const colorName = new Player(shooter as mc.Player).getColorName();
    if (!colorName) {
      return;
    }
    // 色情報を取得できるか
    const color = Setting.colors.find((v) => v.id === colorName);
    if (color) {
      // 色コンポーネントを取得して、値を変更
      const colorComponent = entity.getComponent('minecraft:color') as mc.EntityColorComponent;
      colorComponent.value = color.data;
    }
  }
}
