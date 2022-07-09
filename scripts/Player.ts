import * as mc from 'mojang-minecraft';
import { Block } from './Block';
import { ColorName } from './colors';
import { Setting } from './Setting';

/**
 * プレイヤー(player)に関する処理をまとめたクラス
 */
export class Player {
  player: mc.Player;
  public static operatorTag: string = 'operator';

  constructor(player: mc.Player) {
    this.player = player;
  }

  initilize(): void {
    this.clearColorTag();
    this.clearInventory();
    this.clearEffects();
    // 体力を回復
    this.player.addEffect(mc.MinecraftEffectTypes.instantHealth, 1, 255, false);
    // 満腹度を回復
    this.player.addEffect(mc.MinecraftEffectTypes.saturation, 1, 255, false);
  }

  isOperator(): boolean {
    return this.player.hasTag(Player.operatorTag);
  }

  // getter

  getInventory(): mc.EntityInventoryComponent {
    return this.player.getComponent('minecraft:inventory') as mc.EntityInventoryComponent;
  }

  getColorTag(): string | undefined {
    for (const tag of this.player.getTags()) {
      // 特定の接頭語を含んでいれば
      if (tag.includes('color:')) {
        return tag;
      }
    }
  }

  getColorName(): ColorName | undefined {
    const colorTag = this.getColorTag();
    if (colorTag) {
      return colorTag.replace('color:', '') as ColorName;
    }

    return undefined;
  }

  getBottomBlock(): Block {
    const location = this.player.location;
    const bottomLocation = new mc.BlockLocation(location.x, location.y - 1, location.z);
    return new Block(this.player.dimension.getBlock(bottomLocation));
  }

  public static getOperator(): mc.Player | undefined {
    const operatorQuery = new mc.EntityQueryOptions();
    operatorQuery.tags = [Player.operatorTag];
    const operators = [...mc.world.getPlayers(operatorQuery)];
    if (operators.length > 0) {
      return operators[0];
    }

    return undefined;
  }

  // setter

  setColorTag(colorNumber: number): void {
    const color = Setting.colors[colorNumber];
    if (color) {
      this.player.addTag(`color:${color.id}`);
      this.player.dimension.runCommand(`msg ${this.player.nameTag} 塗る色を「${color.name}」に設定しました。`);
    }
  }

  setOperatorTag(): void {
    this.player.addTag(Player.operatorTag);
  }

  // clear

  clearEffects(): void {
    try {
      this.player.runCommand('effect @s clear');
    } catch {
      // 何も効果を受けていなければエラー扱いになるが問題はないので、停止せずに次へ進む
    }
  }

  clearInventory(): void {
    try {
      this.player.runCommand('clear');
    } catch {
      // 何も持っていなければエラー扱いになるが問題はないので、停止せずに次へ進む
    }
  }

  clearColorTag(): void {
    // いったんすべての色タグを削除する
    // そのエンティティが持っているすべてのタグを取得して繰り返し
    for (const tag of this.player.getTags()) {
      // 特定の接頭語を含んでいれば
      if (tag.includes('color:')) {
        // そのタグを取り除く
        this.player.removeTag(tag);
      }
    }
  }

  // give

  giveGameItem(): void {
    const inventory = this.getInventory();

    // 地図を与える
    const emptyMap: mc.ItemStack = new mc.ItemStack(mc.MinecraftItemTypes.emptyMap, 1);
    inventory.container.addItem(emptyMap);

    // 雪玉を与える
    const snowball: mc.ItemStack = new mc.ItemStack(mc.MinecraftItemTypes.snowball, 16);
    for (let i = 0; i < 5; i += 1) {
      inventory.container.addItem(snowball);
    }

    if (this.isOperator()) {
      this.giveOperatorItem();
    }
  }

  giveLobbyItem(): void {
    if (this.isOperator()) {
      this.giveOperatorItem();
    }
  }

  giveOperatorItem() {
    const inventory = this.getInventory();
    // 設定用の羽根を渡す
    const feather: mc.ItemStack = new mc.ItemStack(mc.MinecraftItemTypes.feather);
    inventory.container.addItem(feather);
  }

  // events

  public static onJoin(event: mc.PlayerJoinEvent) {
    // 独自のプレイヤークラスを生成する
    const player = new Player(event.player);
    // ログイン時にプレイヤー数が0なら最初のプレイヤーなので、オペレーター判定用のタグを与える
    // この時点では自分は数に含まれない
    const currentPlayerCount = [...mc.world.getPlayers()].length;
    if (currentPlayerCount === 0) {
      player.setOperatorTag();
    }
    // プレイヤーの状態を初期化
    player.initilize();
    // ログイン時には /clear が無効になるようなので、個別のスロットを消していく
    // この処理では装備品は消せない
    const inventory = player.getInventory();
    for (let i = 0; i < inventory.container.size; i += 1) {
      inventory.container.setItem(i, new mc.ItemStack(mc.MinecraftItemTypes.air, 0));
    }
    // 初期アイテムを渡す
    player.giveLobbyItem();
  }
}
