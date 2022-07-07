import * as mc from 'mojang-minecraft';
import { Block } from './Block';
import { Player } from './Player';
import { Score } from './Score';
import { Setting } from './Setting';

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

export function inGame(event: mc.TickEvent) {
  if (event.currentTick % 20 === 0) {
    new Score().showResult();
  }

  if (event.currentTick % 5 === 0) {
    reloadBullet();
  }
}

export function onWorldInitilaize(event: mc.WorldInitializeEvent) {
  // ダイナミックプロパティの定義
  const colorDef = new mc.DynamicPropertiesDefinition();
  for (const color of Setting.colors) {
    colorDef.defineNumber(`color:${color.id}`);
  }
  event.propertyRegistry.registerWorldDynamicProperties(colorDef);

  // ダイナミックプロパティの初期値を設定
  for (const color of Setting.colors) {
    mc.world.setDynamicProperty(`color:${color.id}`, 0);
  }
}

export function onPlayerJoin(event: mc.PlayerJoinEvent) {
  // 独自のプレイヤークラスを生成する
  const player = new Player(event.player);
  // プレイヤーの状態を初期化
  player.initilize();
  // ログイン時には/clearが無効になるようなので、個別のスロットを消していく
  const inventory = player.getInventory();
  for (let i = 0; i < inventory.container.size; i += 1) {
    inventory.container.setItem(i, new mc.ItemStack(mc.MinecraftItemTypes.air, 0));
  }
  // // 初期アイテムを渡す
  player.giveLobbyItem();
}

/** ブロックを壊したら雪玉 */
// mc.world.events.blockBreak.subscribe((event) => {
//   overworld.runCommand(`say ${event.brokenBlockPermutation.type.id}`);
//   if (event.brokenBlockPermutation.type.id === mc.MinecraftBlockTypes.wool.id) {
//     const snowball = new mc.ItemStack(mc.MinecraftItemTypes.snowball, 16);
//     event.block.dimension.spawnItem(snowball, event.block.location);
//   }
// });
