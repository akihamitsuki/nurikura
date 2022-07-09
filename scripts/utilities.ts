import * as mc from 'mojang-minecraft';

/**
 * 特定の範囲内の無作為な整数を生成する
 *
 * @param min
 * @param max
 * @returns
 */
export function genrateRandomRangeInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
