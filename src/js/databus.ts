import Pool from './base/pool'
import Animation from './base/animation'
import Enemy from './npc/enemy'
import Bullet from './player/bullet'

/**
 * 全局状态管理器
 */
export default new class {

  pool = new Pool()
  frame = 0
  score = 0
  bullets: Bullet[] = []
  enemys: Enemy[] = []
  animations: Animation[] = []
  gameOver = false

  reset () {
    this.frame = 0
    this.score = 0
    this.bullets = []
    this.enemys = []
    this.animations = []
    this.gameOver = false
  }

  /**
   * 回收敌人，进入对象池
   * 此后不进入帧循环
   */
  removeEnemey (enemy: Enemy) {
    const temp = this.enemys.shift()
    if (temp) {
      temp.visible = false
      this.pool.recover('enemy', enemy)
    }
  }

  /**
   * 回收子弹，进入对象池
   * 此后不进入帧循环
   */
  removeBullets (bullet: Bullet) {
    const temp = this.bullets.shift()
    if (temp) {
      temp.visible = false
      this.pool.recover('bullet', bullet)
    }
  }
}()
