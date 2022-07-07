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

/**
 * ブロック情報を作成
 *
 * @param blockType
 * @param colorName
 * @returns
 */
function createPaintPermutation(blockType: mc.BlockType, colorName: string): mc.BlockPermutation {
  const paintPermutation = blockType.createDefaultBlockPermutation();
  // 色プロパティを取得する
  const colorProperty = paintPermutation.getProperty(mc.BlockProperties.color) as mc.StringBlockProperty;
  // 色を設定する
  colorProperty.value = colorName;
  // 順列情報を返す
  return paintPermutation;
}

/**
 * ブロックを塗る
 *
 * @param hitBlock
 * @param colorName
 */
function paintBlock(hitBlock: mc.Block, colorName: string) {
  // 半径
  const radius = 1;
  // 塗り替えるブロックの種類
  const paintBlockType = mc.MinecraftBlockTypes.wool;
  // 塗り替え先ブロックの組み合わせ情報を作成する
  const paintPermutation = createPaintPermutation(paintBlockType, colorName);
  // 塗った色を数える
  const score = new Score();

  // 各座標別に繰り返し
  for (let x = -radius; x <= radius; x += 1) {
    for (let y = -radius; y <= radius; y += 1) {
      for (let z = -radius; z <= radius; z += 1) {
        // 当たったブロックから相対的な座標を取得する
        const targetLocation = hitBlock.location.offset(x, y, z);
        // その座標のブロックを取得する
        const targetBlock = new Block(hitBlock.dimension.getBlock(targetLocation));
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

/**
 * 羊に色を塗る
 *
 * @param entity
 * @param colorName
 * @returns
 */
function paintSheep(entity: mc.Entity, colorName: string) {
  // 対象が羊であるか
  if (entity.id !== mc.MinecraftEntityTypes.sheep.id) {
    return;
  }
  // 色コンポーネントを持っているか（羊なら持っているはずだが一応）
  if (!entity.hasComponent('minecraft:color')) {
    return;
  }
  // 設定から色情報を取得する
  const color = Setting.colors.find((v) => v.id === colorName);
  if (color) {
    // 色コンポーネントを取得して、値を変更
    const colorComponent = entity.getComponent('minecraft:color') as mc.EntityColorComponent;
    colorComponent.value = color.data;
  }
}

/**
 * 発射物が当たった時のイベント
 *
 * @param event
 * @returns
 */
export function onProjectileHit(event: mc.ProjectileHitEvent) {
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
  // プレイヤーから色情報を取得
  const colorName = new Player(event.source as mc.Player).getColorName();
  if (!colorName) {
    return;
  }

  // ブロックに当たっていれば色を変える
  const hitBlock: mc.BlockHitInformation = event.blockHit;
  if (hitBlock !== undefined) {
    paintBlock(hitBlock.block, colorName);
  }
  // 羊だったら色を変える
  const hitEntity: mc.EntityHitInformation = event.entityHit;
  if (hitEntity !== undefined) {
    paintSheep(hitEntity.entity, colorName);
  }
}

/**
 * 弾を補充する
 */
export function reloadBullet() {
  const snowball = new mc.ItemStack(mc.MinecraftItemTypes.snowball, 1);
  // すべてのプレイヤーで繰り返し
  for (const mcPlayer of mc.world.getPlayers()) {
    // スニークをしているかを判定
    if (!mcPlayer.isSneaking) {
      continue;
    }
    const player = new Player(mcPlayer);
    // 足元のブロックを確認
    const bottomBlock = player.getBottomBlock();
    if (!bottomBlock.isSame(mc.MinecraftBlockTypes.wool)) {
      continue;
    }
    // そのプレイヤーの色と一致するか
    const playerColor = player.getColorName();
    if (playerColor && playerColor === bottomBlock.getColor()) {
      // そのプレイヤーの座標にアイテムを作成(すぐに取得される)
      mcPlayer.dimension.spawnItem(snowball, mcPlayer.location);
    }
  }
}

/** ブロックを壊したら雪玉 */
// mc.world.events.blockBreak.subscribe((event) => {
//   overworld.runCommand(`say ${event.brokenBlockPermutation.type.id}`);
//   if (event.brokenBlockPermutation.type.id === mc.MinecraftBlockTypes.wool.id) {
//     const snowball = new mc.ItemStack(mc.MinecraftItemTypes.snowball, 16);
//     event.block.dimension.spawnItem(snowball, event.block.location);
//   }
// });
