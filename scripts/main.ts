import * as mc from 'mojang-minecraft';
import { setColor, projectileHit, getColorName } from './paint';
import { colorSetting } from './settings';

mc.world.events.beforeItemUse.subscribe(setColor);
mc.world.events.projectileHit.subscribe(projectileHit);

mc.world.events.playerJoin.subscribe((event) => {
  // プレイヤーのインベントリを取得する
  const inventory = event.player.getComponent('minecraft:inventory') as mc.EntityInventoryComponent;

  // インベントリを空にする
  // この時点では /clear は無効
  for (let i = 0; i < inventory.container.size; i += 1) {
    inventory.container.setItem(i, new mc.ItemStack(mc.MinecraftItemTypes.air, 0));
  }

  // 設定用の羽根を渡す
  const feather: mc.ItemStack = new mc.ItemStack(mc.MinecraftItemTypes.feather);
  inventory.container.addItem(feather);

  // 雪玉を与える
  const itemStack: mc.ItemStack = new mc.ItemStack(mc.MinecraftItemTypes.snowball, 16);
  for (let i = 0; i < 8; i += 1) {
    inventory.container.addItem(itemStack);
  }
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
  for (const player of mc.world.getPlayers()) {
    // スニークをしているかを判定
    if (!player.isSneaking) {
      continue;
    }
    // 足元のブロックを確認
    const bottomLocation = new mc.BlockLocation(player.location.x, player.location.y - 1, player.location.z);
    const bottomBlock = player.dimension.getBlock(bottomLocation);
    if (bottomBlock.id !== mc.MinecraftBlockTypes.wool.id) {
      continue;
    }
    // そのプレイヤーの色と一致するか
    const colorProperty = bottomBlock.permutation.getProperty(mc.BlockProperties.color) as mc.StringBlockProperty;
    const colorName = getColorName(player);
    if (colorName && colorName === colorProperty.value) {
      // そのプレイヤーの座標にアイテムを作成(すぐに取得される)
      player.dimension.spawnItem(snowball, player.location);
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
