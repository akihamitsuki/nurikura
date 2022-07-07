import * as mc from 'mojang-minecraft';
import { Player } from './Player';
import { setColor, projectileHit } from './paint';
import { colorSetting } from './settings';

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
  for (const color of colorSetting) {
    colorDef.defineNumber(`color:${color.id}`);
  }
  event.propertyRegistry.registerWorldDynamicProperties(colorDef);

  // ダイナミックプロパティの初期値を設定
  for (const color of colorSetting) {
    mc.world.setDynamicProperty(`color:${color.id}`, 0);
  }
});

// 塗った数を表示
mc.world.events.tick.subscribe((event) => {
  if (event.currentTick % 20 === 0) {
    showCurrentScore();
  }

  if (event.currentTick % 5 === 0) {
    reloadBullet();
  }
});

const overworld = mc.world.getDimension('overworld');
/**
 * 現在のスコアを表示
 */
function showCurrentScore() {
  let text = '';
  for (const color of colorSetting) {
    const count = mc.world.getDynamicProperty(`color:${color.id}`) as number;
    text += `${color.id}: ${count} / `;
  }
  // コマンド数を節約するために、次元をオーバーワールドに限定して@aを用いている
  overworld.runCommand(`title @a actionbar ${text}`);
}

const snowball = new mc.ItemStack(mc.MinecraftItemTypes.snowball, 1);
/**
 * 弾を補充する
 */
function reloadBullet() {
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
