import * as mc from 'mojang-minecraft';
import { setColor, projectileHit } from './paint';
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
const overworld = mc.world.getDimension('overworld');
mc.world.events.tick.subscribe((event) => {
  if (event.currentTick % 20 === 0) {
    let text = '';
    for (const color of colorSetting) {
      const count = mc.world.getDynamicProperty(`color:${color.id}`) as number;
      text += `${color.id}: ${count} / `;
    }
    overworld.runCommand(`title @a actionbar ${text}`);
  }
});
