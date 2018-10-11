import Sprite from '../base/sprite'
import databus from '../databus'

const BULLET_IMG_SRC = 'images/bullet.png'
const BULLET_WIDTH = 16
const BULLET_HEIGHT = 30

export default class Bullet extends Sprite {

  x = 0
  y = 0
  speed = 0

  constructor () {
    super(BULLET_IMG_SRC, BULLET_WIDTH, BULLET_HEIGHT)
  }

  init (x: number, y: number, speed: number) {
    this.x = x
    this.y = y
    this.speed = speed
    this.visible = true
  }

  // 每一帧更新子弹位置
  update () {
    this.y -= this.speed

    // 超出屏幕外回收自身
    if (this.y < -this.height) {
      databus.removeBullets(this)
    }
  }
}
