import * as mc from 'mojang-minecraft';
import { ColorData, ColorName } from './colors';

interface ColorSetting {
  id: ColorName;
  name: string;
  data: ColorData;
}

export const colorSetting: ColorSetting[] = [
  {
    id: 'cyan',
    name: 'シアン',
    data: ColorData.Cyan,
  },
  {
    id: 'magenta',
    name: 'マゼンタ',
    data: ColorData.Magenta,
  },
  {
    id: 'yellow',
    name: 'イエロー',
    data: ColorData.Yellow,
  },
];

/** 塗り替え禁止ブロック一覧 */
export const denyBlocks: mc.BlockType[] = [
  mc.MinecraftBlockTypes.water,
  mc.MinecraftBlockTypes.lava,
  mc.MinecraftBlockTypes.flowingWater,
  mc.MinecraftBlockTypes.flowingLava,
];
