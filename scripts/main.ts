import * as mc from 'mojang-minecraft';
import { Player } from './Player';
import { Score } from './Score';
import { Setting } from './Setting';
import { setColor, onProjectileHit, reloadBullet } from './paint';

mc.world.events.beforeItemUse.subscribe(setColor);
mc.world.events.projectileHit.subscribe(onProjectileHit);

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
