import Sprite from '../base/sprite'

const screenWidth = window.innerWidth
const screenHeight = window.innerHeight

// NOTE: 图片会被拉伸至屏幕大小
const BG_IMG_SRC = 'images/bg.jpg'
const BG_WIDTH = 512
const BG_HEIGHT = 512

/**
 * 游戏背景类
 * 提供update和render函数实现无限滚动的背景功能
 */
export default class BackGround extends Sprite {
  top = 0

  constructor (ctx: CanvasRenderingContext2D) {
    super(BG_IMG_SRC, BG_WIDTH, BG_HEIGHT)

    this.render(ctx)
  }

  update () {
    this.top = this.top >= screenHeight ? 0 : this.top + 2
  }

  /**
   * 背景图重绘函数
   * 绘制两张图片，两张图片大小和屏幕一致
   * 第一张漏出高度为top部分，其余的隐藏在屏幕上面
   * 第二张补全除了top高度之外的部分，其余的隐藏在屏幕下面
   */
  render (ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < 2; i++) {
      ctx.drawImage(
        this.img,
        0,
        0,
        this.width,
        this.height,
        0,
        this.top - i * screenHeight,
        screenWidth,
        screenHeight,
      )
    }
  }
}
