import * as mc from 'mojang-minecraft';
import { colorSetting } from './settings';

interface ColorCount {
  color: string;
  count: number;
}

export class Score {
  count: ColorCount[] = [];

  constructor() {
    for (const setting of colorSetting) {
      this.count.push({
        color: setting.id,
        count: 0,
      });
    }
  }

  add(color: string | undefined, point: number): void {
    if (color) {
      const index: number = this.count.findIndex((v) => v.color === color);
      if (index !== -1) {
        this.count[index].count += point;
      }
    }
  }

  /**
   * 塗り替えた色の数を保存先のダイナミックプロパティに加算する
   */
  save(): void {
    for (const c of this.count) {
      // 変更数が0なら次へ
      if (!c.count) {
        continue;
      }
      // 現在の数を取得する
      const current = mc.world.getDynamicProperty(`color:${c.color}`) as number;
      // 数を加算して設定
      mc.world.setDynamicProperty(`color:${c.color}`, current + c.count);
    }
  }

  /**
   * 結果を表示する
   */
  showResult() {
    let text = '';
    for (const color of colorSetting) {
      const count = mc.world.getDynamicProperty(`color:${color.id}`) as number;
      text += `${color.id}: ${count} / `;
    }
    for (const player of mc.world.getPlayers()) {
      player.runCommand(`title @s actionbar ${text}`);
    }
  }
}
