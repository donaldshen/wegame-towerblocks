import Player from './player/index'
import Enemy from './npc/enemy'
import BackGround from './runtime/background'
import GameInfo from './runtime/gameinfo'
import Music from './runtime/music'
import databus from './databus'

const ctx = canvas.getContext('2d')

/**
 * 游戏主函数
 */
export default class Main {

  // 维护当前requestAnimationFrame的id
  aniId = 0
  bg = new BackGround(ctx)
  player = new Player()
  gameinfo = new GameInfo()
  music = new Music()
  bindLoop = this.loop.bind(this)
  hasEventBind = false

  constructor () {
    this.touchEventHandler = this.touchEventHandler.bind(this)
    this.restart()
  }

  restart () {
    databus.reset()

    canvas.removeEventListener(
      'touchstart',
      this.touchEventHandler,
    )

    this.bg = new BackGround(ctx)
    this.player = new Player()
    this.gameinfo = new GameInfo()
    this.music = new Music()
    this.bindLoop =
    this.hasEventBind = false

    // 清除上一局的动画
    window.cancelAnimationFrame(this.aniId)

    this.aniId = window.requestAnimationFrame(this.loop.bind(this))
  }

  /**
   * 随着帧数变化的敌机生成逻辑
   * 帧数取模定义成生成的频率
   */
  enemyGenerate () {
    if (databus.frame % 30 === 0) {
      const enemy = databus.pool.getItemByClass('enemy', Enemy)
      enemy.init(6)
      databus.enemys.push(enemy)
    }
  }

  // 全局碰撞检测
  collisionDetection () {
    databus.bullets.forEach((bullet) => {
      const enemy = databus.enemys.find(e => !e.isPlaying && e.isCollideWith(bullet))
      if (enemy) {
        enemy.playAnimation()
        this.music.playExplosion()

        bullet.visible = false
        databus.score += 1
      }
    })

    if (databus.enemys.some(e => this.player.isCollideWith(e))) {
      databus.gameOver = true
    }
  }

  // 游戏结束后的触摸事件处理逻辑
  touchEventHandler (e: TouchEvent) {
    e.preventDefault()

    const x = e.touches[0].clientX
    const y = e.touches[0].clientY

    const area = this.gameinfo.btnArea

    if (area.startX <= x && x <= area.endX
      && area.startY <= y && y <= area.endY) {
      this.restart()
    }
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render () {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.bg.render(ctx)

    databus.bullets
      .concat(databus.enemys)
      .forEach((item) => {
        item.drawToCanvas(ctx)
      })

    this.player.drawToCanvas(ctx)

    databus.animations.forEach((ani) => {
      if (ani.isPlaying) {
        ani.aniRender(ctx)
      }
    })

    this.gameinfo.renderGameScore(ctx, databus.score)

    // 游戏结束停止帧循环
    if (databus.gameOver) {
      this.gameinfo.renderGameOver(ctx, databus.score)

      if (!this.hasEventBind) {
        this.hasEventBind = true
        canvas.addEventListener('touchstart', this.touchEventHandler)
      }
    }
  }

  // 游戏逻辑更新主函数
  update () {
    if (databus.gameOver) return

    this.bg.update()

    databus.bullets.forEach(b => b.update())
    databus.enemys.forEach(e => e.update())

    this.enemyGenerate()

    this.collisionDetection()

    if (databus.frame % 20 === 0) {
      this.player.shoot()
      this.music.playShoot()
    }
  }

  // 实现游戏帧循环
  loop () {
    databus.frame++

    this.update()
    this.render()

    this.aniId = window.requestAnimationFrame(this.loop.bind(this))
  }
}
