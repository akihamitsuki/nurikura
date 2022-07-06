import * as mc from 'mojang-minecraft';
import * as mcui from 'mojang-minecraft-ui';
import { colorSetting } from './settings';

/** 塗り替え禁止ブロック一覧 */
const denyBlocks: mc.BlockType[] = [
  mc.MinecraftBlockTypes.water,
  mc.MinecraftBlockTypes.lava,
  mc.MinecraftBlockTypes.flowingWater,
  mc.MinecraftBlockTypes.flowingLava,
];

interface Coordinate {
  x: number;
  y: number;
  z: number;
}

interface Direction {
  readonly up: Coordinate;
  readonly down: Coordinate;
  readonly north: Coordinate;
  readonly south: Coordinate;
  readonly west: Coordinate;
  readonly east: Coordinate;
  [key: string]: Coordinate;
}

const directions: Direction = {
  up: { x: 0, y: 1, z: 0 },
  down: { x: 0, y: -1, z: 0 },
  south: { x: 0, y: 0, z: 1 },
  north: { x: 0, y: 0, z: -1 },
  east: { x: 1, y: 0, z: 0 },
  west: { x: -1, y: 0, z: 0 },
};

/**
 * 塗り替え可能判定
 *
 * @param block 対象ブロック
 * @returns 塗り替え可能かどうか
 */
function canPaint(block: mc.Block): boolean {
  // (そのブロックが空気ではない) かつ (塗り替え禁止ブロックではない) かつ (露出ブロックである)
  return !block.isEmpty && !denyBlocks.includes(block.type) && isExposedBlock(block);
}

export function setColor(event: mc.BeforeItemUseEvent): void {
  // 使用したアイテムが特定のアイテム以外なら処理を終了 -> 特定のアイテムを使用した場合だけ次の処理へ
  // ここでは羽根(feather)を使用した場合だけ有効
  if (event.item.id !== mc.MinecraftItemTypes.feather.id) {
    return;
  }

  // イベントからプレイヤーを取得する
  const player = <mc.Player>event.source;

  // フォームのインスタンスを作成
  const actionForm = new mcui.ActionFormData();
  // 題名を追加
  actionForm.title('色選択');
  // 設問を追加
  actionForm.body('塗る色を選択してください。');
  // 選択肢を追加（追加順が、そのまま並び順になる
  for (const color of colorSetting) {
    actionForm.button(color.name);
  }

  // フォームを表示(show)し、入力後(then)の処理を続けて書く
  actionForm.show(player).then((response) => {
    // いったんすべての色タグを削除する
    // そのエンティティが持っているすべてのタグを取得して繰り返し
    for (const tag of player.getTags()) {
      // 特定の接頭語を含んでいれば
      if (tag.includes('color:')) {
        // そのタグを取り除く
        player.removeTag(tag);
      }
    }

    // 選択にあわせて処理を行う
    const color = colorSetting[response.selection];
    if (color) {
      player.addTag(`color:${color.id}`);
      player.dimension.runCommand(`/tell @s 塗る色を「${color.name}」に設定しました。`);
    }
  });

  // アイテムの使用を取り消す
  event.cancel = true;
}

/**
 * そのブロックは空気に触れているか
 *
 * 表面だけ塗りたいので、地中などのブロックを塗り替えないようにしたい
 *
 * @param block 対象ブロック
 * @return 判定
 */
function isExposedBlock(block: mc.Block): boolean {
  // あらかじめ設定しておいた向き配列で繰り返し
  for (const key in directions) {
    // その向きのブロックを取得する
    // 今回の座標を取得する
    const { x, y, z } = directions[key];
    // その座標のブロックを取得する
    const targetBlock = block.dimension.getBlock(block.location.offset(x, y, z));
    // その向きにあるブロックは空気であるか
    if (targetBlock.isEmpty) {
      // 真ならリターンして終了(今回の条件ではどこか1つだけでいい)
      return true;
    }
  }
  return false;
}

export function getColorName(player: mc.Player): string | undefined {
  for (const tag of player.getTags()) {
    // 特定の接頭語を含んでいれば
    if (tag.includes('color:')) {
      return tag.replace('color:', '');
    }
  }

  return undefined;
}

interface ColorCount {
  color: string;
  count: number;
}

function getColorCountObject() {
  const colorCount: ColorCount[] = [];
  for (const setting of colorSetting) {
    colorCount.push({
      color: setting.id,
      count: 0,
    });
  }
  return colorCount;
}

/**
 * 発射物が当たった時のイベント
 *
 * @param event
 * @returns
 */
export function projectileHit(event: mc.ProjectileHitEvent) {
  // 発射したエンティティ
  const shooter = event.source;
  if (shooter.id !== mc.MinecraftEntityTypes.player.id) {
    return;
  }
  // 当たった発射物
  const projectile = event.projectile;
  if (projectile.id !== mc.MinecraftEntityTypes.snowball.id) {
    return;
  }

  // ブロックに当たっていれば
  const hitBlock: mc.BlockHitInformation = event.blockHit;
  if (hitBlock !== undefined) {
    // 塗り替えるブロックの種類
    const blockType = mc.MinecraftBlockTypes.wool;
    // 色を変更するのは少し手間がかかる
    // 塗り替え先ブロックの組み合わせ情報を作成する
    const permutation = blockType.createDefaultBlockPermutation();
    // 色プロパティを取得する
    const colorProperty = permutation.getProperty(mc.BlockProperties.color) as mc.StringBlockProperty;
    // プレイヤーのタグから色を取得する
    const colorName = getColorName(shooter as mc.Player);
    if (!colorName) {
      return;
    }
    colorProperty.value = colorName;
    // 半径
    const radius = 1;
    // 塗った色を数える
    const colorCount: ColorCount[] = getColorCountObject();

    // 各座標別に繰り返し
    for (let x = -radius; x <= radius; x += 1) {
      for (let y = -radius; y <= radius; y += 1) {
        for (let z = -radius; z <= radius; z += 1) {
          // 当たったブロックから相対的な座標を取得する
          const targetLocation = hitBlock.block.location.offset(x, y, z);
          // その座標のブロックを取得する
          const targetBlock = event.dimension.getBlock(targetLocation);
          // そのブロックが塗り替え可能ならば
          if (canPaint(targetBlock)) {
            // 対象のブロック同じ種類のブロックなら
            // 塗られて消えるブロックなので、その色の数を減らす
            if (targetBlock.id === blockType.id) {
              const beforePermutation = targetBlock.permutation.getProperty(
                mc.BlockProperties.color
              ) as mc.StringBlockProperty;
              const index: number = colorCount.findIndex((v) => v.color === beforePermutation.value);
              if (index !== -1) {
                colorCount[index].count -= 1;
              }
            }
            // ブロックの種類を変更
            targetBlock.setType(blockType);
            // ブロック内の情報を設定する（色変更）。もとの情報を変更するのではなく、新しく上書きする
            targetBlock.setPermutation(permutation);
            // 塗ったブロックなので、その色の数を増やす
            const index: number = colorCount.findIndex((v) => v.color === colorName);
            if (index !== -1) {
              colorCount[index].count += 1;
            }
          }
        }
      }
    }

    // ダイナミックプロパティに色の数を加算・減算する
    for (const c of colorCount) {
      // 現在の数を取得する
      const count = mc.world.getDynamicProperty(`color:${c.color}`) as number;
      // 数を加算して設定
      mc.world.setDynamicProperty(`color:${c.color}`, count + c.count);
    }
  }

  // 羊だったら色を変える
  const hitEntity: mc.EntityHitInformation = event.entityHit;
  if (hitEntity !== undefined) {
    const entity = hitEntity.entity;
    // 対象が羊であるか
    if (hitEntity.entity.id !== mc.MinecraftEntityTypes.sheep.id) {
      return;
    }
    // 色コンポーネントを持っているか
    if (!entity.hasComponent('minecraft:color')) {
      return;
    }
    // プレイヤーから色情報を取得できるか
    const colorName = getColorName(shooter as mc.Player);
    if (!colorName) {
      return;
    }
    // 色情報を取得できるか
    const color = colorSetting.find((v) => v.id === colorName);
    if (color) {
      // 色コンポーネントを取得して、値を変更
      const colorComponent = entity.getComponent('minecraft:color') as mc.EntityColorComponent;
      colorComponent.value = color.data;
    }
  }
}
