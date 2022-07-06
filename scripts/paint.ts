import * as mc from 'mojang-minecraft';
import * as mcui from 'mojang-minecraft-ui';
import { Block } from './Block';
import { Player } from './Player';
import { colorSetting } from './settings';

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
  for (const color of colorSetting) {
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

interface ColorCount {
  color: string;
  count: number;
}

function getColorCountObject() {
  const colorCount: ColorCount[] = [];
  for (const setting of colorSetting) {
    colorCount.push({
      color: setting.id,
      count: 0,
    });
  }
  return colorCount;
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
    // 塗り替えるブロックの種類
    const blockType = mc.MinecraftBlockTypes.wool;
    // 色を変更するのは少し手間がかかる
    // 塗り替え先ブロックの組み合わせ情報を作成する
    const permutation = blockType.createDefaultBlockPermutation();
    // 色プロパティを取得する
    const colorProperty = permutation.getProperty(mc.BlockProperties.color) as mc.StringBlockProperty;
    // プレイヤーのタグから色を取得する
    const player = new Player(shooter as mc.Player);
    const colorName = player.getColorName();
    if (!colorName) {
      return;
    }
    colorProperty.value = colorName;
    // 半径
    const radius = 1;
    // 塗った色を数える
    const colorCount: ColorCount[] = getColorCountObject();

    // 各座標別に繰り返し
    for (let x = -radius; x <= radius; x += 1) {
      for (let y = -radius; y <= radius; y += 1) {
        for (let z = -radius; z <= radius; z += 1) {
          // 当たったブロックから相対的な座標を取得する
          const targetLocation = hitBlock.block.location.offset(x, y, z);
          // その座標のブロックを取得する
          const targetBlock = event.dimension.getBlock(targetLocation);
          // そのブロックが塗り替え可能ならば
          if (new Block(targetBlock).canPaint()) {
            // 対象のブロック同じ種類のブロックなら
            // 塗られて消えるブロックなので、その色の数を減らす
            if (targetBlock.id === blockType.id) {
              const beforePermutation = targetBlock.permutation.getProperty(
                mc.BlockProperties.color
              ) as mc.StringBlockProperty;
              const index: number = colorCount.findIndex((v) => v.color === beforePermutation.value);
              if (index !== -1) {
                colorCount[index].count -= 1;
              }
            }
            // ブロックの種類を変更
            targetBlock.setType(blockType);
            // ブロック内の情報を設定する（色変更）。もとの情報を変更するのではなく、新しく上書きする
            targetBlock.setPermutation(permutation);
            // 塗ったブロックなので、その色の数を増やす
            const index: number = colorCount.findIndex((v) => v.color === colorName);
            if (index !== -1) {
              colorCount[index].count += 1;
            }
          }
        }
      }
    }

    // ダイナミックプロパティに色の数を加算・減算する
    for (const c of colorCount) {
      // 現在の数を取得する
      const count = mc.world.getDynamicProperty(`color:${c.color}`) as number;
      // 数を加算して設定
      mc.world.setDynamicProperty(`color:${c.color}`, count + c.count);
    }
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
    const color = colorSetting.find((v) => v.id === colorName);
    if (color) {
      // 色コンポーネントを取得して、値を変更
      const colorComponent = entity.getComponent('minecraft:color') as mc.EntityColorComponent;
      colorComponent.value = color.data;
    }
  }
}
