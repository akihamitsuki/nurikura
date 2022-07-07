import * as mc from 'mojang-minecraft';
import { Block } from './Block';
import { colorSetting } from './settings';

export class Player {
  player: mc.Player;

  constructor(player: mc.Player) {
    this.player = player;
  }

  initilize(): void {
    this.clearInventory();
  }

  getInventory(): mc.EntityInventoryComponent {
    return this.player.getComponent('minecraft:inventory') as mc.EntityInventoryComponent;
  }

  clearInventory(): void {
    // 通常は次のコマンドだけで消える
    // this.player.runCommand('clear');
    // ログイン時などは上のコマンドが無効になるようなので、個別スロットに対して0個の空気を入れて削除する
    // ただし、装備中の防具などは消えない（まだ消せる機能がないはず）
    const inventory = this.getInventory();
    for (let i = 0; i < inventory.container.size; i += 1) {
      inventory.container.setItem(i, new mc.ItemStack(mc.MinecraftItemTypes.air, 0));
    }
  }

  giveInitialItem(): void {
    const inventory = this.getInventory();
    // 設定用の羽根を渡す
    const feather: mc.ItemStack = new mc.ItemStack(mc.MinecraftItemTypes.feather);
    inventory.container.addItem(feather);
    // 雪玉を与える
    const itemStack: mc.ItemStack = new mc.ItemStack(mc.MinecraftItemTypes.snowball, 16);
    for (let i = 0; i < 8; i += 1) {
      inventory.container.addItem(itemStack);
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

  setColorTag(colorNumber: number): void {
    const color = colorSetting[colorNumber];
    if (color) {
      this.player.addTag(`color:${color.id}`);
      this.player.dimension.runCommand(`msg ${this.player.nameTag} 塗る色を「${color.name}」に設定しました。`);
    }
  }

  getColorTag(): string | undefined {
    for (const tag of this.player.getTags()) {
      // 特定の接頭語を含んでいれば
      if (tag.includes('color:')) {
        return tag;
      }
    }
  }

  getColorName(): string | undefined {
    const colorTag = this.getColorTag();
    if (colorTag) {
      return colorTag.replace('color:', '');
    }

    return undefined;
  }

  getBottomBlock(): Block {
    const location = this.player.location;
    const bottomLocation = new mc.BlockLocation(location.x, location.y - 1, location.z);
    return new Block(this.player.dimension.getBlock(bottomLocation));
  }
}
