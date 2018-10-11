import Sprite from '../base/sprite'
import Bullet from './bullet'
import databus from '../databus'
import { clamp } from 'js/utils/util'

const screenWidth = window.innerWidth
const screenHeight = window.innerHeight

// 玩家相关常量设置
const PLAYER_IMG_SRC = 'images/hero.png'
const PLAYER_WIDTH = 80
const PLAYER_HEIGHT = 80

export default class Player extends Sprite {

  // 玩家默认处于屏幕底部居中位置
  x = screenWidth / 2 - this.width / 2
  y = screenHeight - this.height - 30

  // 用于在手指移动的时候标识手指是否已经在飞机上了
  touched = false
  bullets = []

  constructor () {
    super(PLAYER_IMG_SRC, PLAYER_WIDTH, PLAYER_HEIGHT)

    // 初始化事件监听
    this.initEvent()
  }

  /**
   * 当手指触摸屏幕的时候
   * 判断手指是否在飞机上
   */
  checkIsFingerOnAir (x: number, y: number) {
    const deviation = 30

    return this.x - deviation <= x && x <= this.x + this.width + deviation
      && this.y - deviation <= y && y <= this.y + this.height + deviation
  }

  /**
   * 根据手指的位置设置飞机的位置
   * 保证手指处于飞机中间
   * 同时限定飞机的活动范围限制在屏幕中
   */
  setAirPosAcrossFingerPosZ (x: number, y: number) {
    this.x = clamp(x - this.width / 2, 0, screenWidth - this.width)
    this.y = clamp(y - this.height / 2, 0, screenHeight - this.height)
  }

  /**
   * 玩家响应手指的触摸事件
   * 改变战机的位置
   */
  initEvent () {
    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault()

      let x = e.touches[0].clientX
      let y = e.touches[0].clientY

      //
      if (this.checkIsFingerOnAir(x, y)) {
        this.touched = true

        this.setAirPosAcrossFingerPosZ(x, y)
      }

    })

    canvas.addEventListener('touchmove', ((e: TouchEvent) => {
      e.preventDefault()

      let x = e.touches[0].clientX
      let y = e.touches[0].clientY

      if (this.touched) {
        this.setAirPosAcrossFingerPosZ(x, y)
      }

    }).bind(this))

    canvas.addEventListener('touchend', (e: TouchEvent) => {
      e.preventDefault()
      this.touched = false
    })
  }

  /**
   * 玩家射击操作
   * 射击时机由外部决定
   */
  shoot () {
    const bullet = databus.pool.getItemByClass('bullet', Bullet)

    bullet.init(
      this.x + this.width / 2 - bullet.width / 2,
      this.y - 10,
      10,
    )

    databus.bullets.push(bullet)
  }
}
