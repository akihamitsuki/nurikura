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
