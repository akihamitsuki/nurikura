import * as mc from 'mojang-minecraft';
import { Paint } from './Paint';
import { Player } from './Player';

/**
 * 使用する武器(weapon)に関する処理をまとめたクラス
 */
export class Weapon {
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
      Paint.paintBlock(hitBlock.block, colorName);
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
}
