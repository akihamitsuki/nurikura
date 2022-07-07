import * as mc from 'mojang-minecraft';
import * as mcui from 'mojang-minecraft-ui';
import { Player } from './Player';
import { Setting } from './Setting';
import { onProjectileHit, onWorldInitilaize, onPlayerJoin, inGame } from './paint';

function switchGameStart(event: mc.BeforeItemUseEvent): void {
  // 使用したアイテムが特定のアイテム以外なら処理を終了 -> 特定のアイテムを使用した場合だけ次の処理へ
  // ここでは羽根(feather)を使用した場合だけ有効
  if (event.item.id !== mc.MinecraftItemTypes.feather.id) {
    return;
  }

  // フォームのインスタンスを作成
  const actionForm = new mcui.ActionFormData();
  actionForm.title('ゲーム開始');
  actionForm.body('ゲームを開始しますか？');
  actionForm.button('開始する');

  // イベントからプレイヤーを取得する
  const player = new Player(event.source as mc.Player);
  // フォームを表示(show)し、入力後(then)の処理を続けて書く
  actionForm.show(player.player).then((response) => {
    if (response.isCanceled) {
      return;
    }
    Game.start();
  });

  // アイテムの使用を取り消す
  event.cancel = true;
}

function switchGameEnd(event: mc.BeforeItemUseEvent): void {
  if (event.item.id !== mc.MinecraftItemTypes.feather.id) {
    return;
  }

  // フォームのインスタンスを作成
  const actionForm = new mcui.ActionFormData();
  actionForm.title('ゲーム終了');
  actionForm.body('ゲームを終了しますか？');
  actionForm.button('終了する');

  // イベントからプレイヤーを取得する
  const player = new Player(event.source as mc.Player);
  // フォームを表示(show)し、入力後(then)の処理を続けて書く
  actionForm.show(player.player).then((response) => {
    if (response.isCanceled) {
      return;
    }
    Game.end();
  });

  // アイテムの使用を取り消す
  event.cancel = true;
}

export class Game {
  public static isInRunning: boolean = false;

  public static initialize() {
    mc.world.events.worldInitialize.subscribe(onWorldInitilaize);
    mc.world.events.playerJoin.subscribe(onPlayerJoin);
    mc.world.events.beforeItemUse.subscribe(switchGameStart);
  }

  public static start() {
    this.isInRunning = true;
    // subscribe
    mc.world.events.tick.subscribe(inGame);
    mc.world.events.projectileHit.subscribe(onProjectileHit);
    mc.world.events.beforeItemUse.subscribe(switchGameEnd);
    // unsubscribe
    mc.world.events.beforeItemUse.unsubscribe(switchGameStart);

    for (const mcPlayer of mc.world.getPlayers()) {
      const player = new Player(mcPlayer);
      player.initilize();
      player.setColorTag(Math.floor(Math.random() * Setting.colors.length));
      player.giveGameItem();
      mcPlayer.runCommand('gamemode survival');
    }
  }

  public static end() {
    this.isInRunning = false;
    // subscribe
    mc.world.events.beforeItemUse.subscribe(switchGameStart);
    // unsubscribe
    mc.world.events.tick.unsubscribe(inGame);
    mc.world.events.projectileHit.unsubscribe(onProjectileHit);
    mc.world.events.beforeItemUse.unsubscribe(switchGameEnd);

    for (const mcPlayer of mc.world.getPlayers()) {
      const player = new Player(mcPlayer);
      player.initilize();
      player.giveLobbyItem();
      mcPlayer.runCommand('gamemode adventure');
    }
  }
}
