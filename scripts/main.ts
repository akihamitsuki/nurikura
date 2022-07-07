import * as mc from 'mojang-minecraft';
import { Player } from './Player';
import { Score } from './Score';
import { setColor, projectileHit } from './paint';
import { Setting } from './Setting';

mc.world.events.beforeItemUse.subscribe(setColor);
mc.world.events.projectileHit.subscribe(projectileHit);

mc.world.events.playerJoin.subscribe((event) => {
  // 独自のプレイヤークラスを生成する
  const player = new Player(event.player);
  // プレイヤーの状態を初期化
  player.initilize();
  // // 初期アイテムを渡す
  player.giveInitialItem();
});

mc.world.events.worldInitialize.subscribe((event) => {
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
});

// 塗った数を表示
mc.world.events.tick.subscribe((event) => {
  if (event.currentTick % 20 === 0) {
    new Score().showResult();
  }

  if (event.currentTick % 5 === 0) {
    reloadBullet();
  }
});

/**
 * 弾を補充する
 */
function reloadBullet() {
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
