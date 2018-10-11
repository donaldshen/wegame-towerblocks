import Animation from '../base/animation'
import databus from '../databus'

const ENEMY_IMG_SRC = 'images/enemy.png'
const ENEMY_WIDTH = 60
const ENEMY_HEIGHT = 60

function rnd (start: number, end: number) {
  return Math.floor(Math.random() * (end - start) + start)
}

export default class Enemy extends Animation {

  speed = 0
  x = 0
  y = 0

  constructor () {
    super(ENEMY_IMG_SRC, ENEMY_WIDTH, ENEMY_HEIGHT)

    this.initExplosionAnimation()
  }

  init (speed: number) {
    this.speed = speed
    this.x = rnd(0, window.innerWidth - ENEMY_WIDTH)
    this.y = -this.height

    this.visible = true
  }

  // 预定义爆炸的帧动画
  initExplosionAnimation () {
    this.initFrames(
      Array(19).fill(1).map((_, i) => `images/explosion${ i + 1 }.png`),
    )
  }

  // 每一帧更新子弹位置
  update () {
    this.y += this.speed

    // 对象回收
    if (this.y > window.innerHeight + this.height) {
      databus.removeEnemey(this)
    }
  }
}
