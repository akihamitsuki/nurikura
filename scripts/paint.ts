import * as mc from 'mojang-minecraft';
import { ColorName, ColorData } from './colors';

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
    // 色は任意の文字列ではなく、決まった値から選ぶ必要がある。
    const color: ColorName = 'red';
    colorProperty.value = color;
    // 半径
    const radius = 1;
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
            // ブロックの種類を変更
            targetBlock.setType(blockType);
            // ブロック内の情報を設定する（色変更）。もとの情報を変更するのではなく、新しく上書きする
            targetBlock.setPermutation(permutation);
          }
        }
      }
    }
  }

  // 羊だったら色を変える
  const hitEntity: mc.EntityHitInformation = event.entityHit;
  if (hitEntity !== undefined) {
    const entity = hitEntity.entity;
    if (hitEntity.entity.id !== mc.MinecraftEntityTypes.sheep.id) {
      return;
    }

    if (entity.hasComponent('minecraft:color')) {
      const color = entity.getComponent('minecraft:color') as mc.EntityColorComponent;
      color.value = ColorData.Red;
    }
  }
}
