import * as mc from 'mojang-minecraft';
import { ColorName } from './colors';
import { Setting } from './Setting';

interface ColorCount {
  color: string;
  count: number;
}

/**
 * 得点(score)に関する処理をまとめたクラス
 */
export class Score {
  count: ColorCount[] = [];

  constructor() {
    for (const color of Setting.colors) {
      this.count.push({
        color: color.id,
        count: 0,
      });
    }
  }

  /**
   * その色の得点を加算する（負の数も有効）
   *
   * @param color 対象となる色
   * @param point 得点
   */
  add(color: ColorName | undefined, point: number): void {
    if (color === undefined) {
      return;
    }

    const index: number = this.count.findIndex((v) => v.color === color);
    if (index !== -1) {
      this.count[index].count += point;
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
  public static showResult() {
    let text = '';
    for (const color of Setting.colors) {
      const count = mc.world.getDynamicProperty(`color:${color.id}`) as number;
      text += `${color.id}: ${count} / `;
    }
    for (const player of mc.world.getPlayers()) {
      player.runCommand(`title @s actionbar ${text}`);
    }
  }
}
