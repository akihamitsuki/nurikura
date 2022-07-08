import * as mc from 'mojang-minecraft';
import { ColorName } from './colors';
import { Block } from './Block';
import { Paint } from './Paint';
import { Player } from './Player';
import { Score } from './Score';

/**
 * 使用する武器(weapon)に関する処理をまとめたクラス
 */
export class Weapon {
  // 塗り替え後のブロック
  static paintBlockType = mc.MinecraftBlockTypes.wool;
  // 塗る広さ
  static radius = 1;

  /**
   * 発射物が当たった時のイベント
   *
   * @param event
   * @returns
   */
  public static onProjectileHit(event: mc.ProjectileHitEvent) {
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
    // プレイヤーから色情報を取得
    const colorName = new Player(event.source as mc.Player).getColorName();
    if (!colorName) {
      return;
    }

    // ブロックに当たっていれば色を変える
    const hitBlock: mc.BlockHitInformation = event.blockHit;
    if (hitBlock !== undefined) {
      Weapon.paintBlock(hitBlock.block, colorName);
    }
    // 羊だったら色を変える
    const hitEntity: mc.EntityHitInformation = event.entityHit;
    if (hitEntity !== undefined) {
      Paint.paintSheep(hitEntity.entity, colorName);
    }
  }

  /**
   * 弾を補充する
   */
  public static reloadBullet() {
    const snowball = new mc.ItemStack(mc.MinecraftItemTypes.snowball, 1);
    // すべてのプレイヤーで繰り返し
    for (const mcPlayer of mc.world.getPlayers()) {
      // スニークをしているかを判定
      if (!mcPlayer.isSneaking) {
        continue;
      }
      const player = new Player(mcPlayer);
      // 足元のブロックを確認
      const bottomBlock = player.getBottomBlock();
      if (!bottomBlock.isSame(mc.MinecraftBlockTypes.wool)) {
        continue;
      }
      // そのプレイヤーの色と一致するか
      const playerColor = player.getColorName();
      if (playerColor && playerColor === bottomBlock.getColor()) {
        // そのプレイヤーの座標にアイテムを作成(すぐに取得される)
        mcPlayer.dimension.spawnItem(snowball, mcPlayer.location);
      }
    }
  }

  /**
   * どのようにブロックを塗るか
   *
   * @param block 基準となるブロック
   * @param colorID 塗り替える色名
   */
  private static paintBlock(block: mc.Block, colorID: ColorName) {
    // 対象ブロックを取得して繰り返し
    const targetBlocks: Block[] = new Block(block).getAroundBlocks(this.radius);

    // 得点として塗る色を数える
    const score = new Score();
    for (const block of targetBlocks) {
      // 対象のブロック同じ種類のブロックなら
      if (block.isSame(this.paintBlockType)) {
        // 塗られて消えるブロックなので、その色の得点を減らす
        score.add(block.getColor(), -1);
      }
      // 塗ったブロックなので、その色の得点を増やす
      score.add(colorID, 1);
      // もし塗る前と塗った後が同じ色なら相殺されて得点は0になる
    }
    // 塗り替えた色の数を保存する
    score.save();

    // 対象ブロックを塗る
    for (const block of targetBlocks) {
      block.paint(this.paintBlockType, colorID);
    }
  }
}
