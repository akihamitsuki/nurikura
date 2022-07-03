import * as mc from 'mojang-minecraft';
import { projectileHit } from './paint';

mc.world.events.projectileHit.subscribe(projectileHit);

mc.world.events.playerJoin.subscribe((event) => {
  // プレイヤーに雪玉を与える
  // アイテムスタックを作成する
  const itemStack: mc.ItemStack = new mc.ItemStack(mc.MinecraftItemTypes.snowball, 16);
  // プレイヤーのインベントリを取得する
  const inventory = event.player.getComponent('minecraft:inventory') as mc.EntityInventoryComponent;
  // インベントリにアイテムを追加する処理を9回繰り返す
  for (let i = 0; i < 9; i += 1) {
    inventory.container.addItem(itemStack);
  }
});
