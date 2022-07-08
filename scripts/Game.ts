import * as mc from 'mojang-minecraft';
import * as mcui from 'mojang-minecraft-ui';
import { Player } from './Player';
import { Score } from './Score';
import { Setting } from './Setting';
import { Weapon } from './Weapon';

/**
 * ゲーム(game)全体に関する処理をまとめたクラス
 */
export class Game {
  public static isInRunning: boolean = false;

  public static initialize() {
    mc.world.events.worldInitialize.subscribe(this.worldInitilaizeEvent);
    mc.world.events.playerJoin.subscribe(Player.onJoin);
    mc.world.events.beforeItemUse.subscribe(this.startEvent);
  }

  public static start() {
    this.isInRunning = true;
    // subscribe
    mc.world.events.tick.subscribe(this.inGameTickEvent);
    mc.world.events.projectileHit.subscribe(Weapon.onProjectileHit);
    mc.world.events.beforeItemUse.subscribe(this.endEvent);
    // unsubscribe
    mc.world.events.beforeItemUse.unsubscribe(this.startEvent);

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
    mc.world.events.beforeItemUse.subscribe(this.startEvent);
    // unsubscribe
    mc.world.events.tick.unsubscribe(this.inGameTickEvent);
    mc.world.events.projectileHit.unsubscribe(Weapon.onProjectileHit);
    mc.world.events.beforeItemUse.unsubscribe(this.endEvent);

    for (const mcPlayer of mc.world.getPlayers()) {
      const player = new Player(mcPlayer);
      player.initilize();
      player.giveLobbyItem();
      mcPlayer.runCommand('gamemode adventure');
    }
  }

  // events

  public static worldInitilaizeEvent(event: mc.WorldInitializeEvent) {
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

  public static inGameTickEvent(event: mc.TickEvent) {
    if (event.currentTick % 20 === 0) {
      Score.showResult();
    }

    if (event.currentTick % 5 === 0) {
      Weapon.reloadBullet();
    }
  }

  public static startEvent(event: mc.BeforeItemUseEvent): void {
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

  public static endEvent(event: mc.BeforeItemUseEvent): void {
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
}
