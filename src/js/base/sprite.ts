/**
 * 游戏基础的精灵类
 */
export default class Sprite {

  img = new Image()
  visible = true

  constructor (
    imgSrc = '',
    public width = 0,
    public height = 0,
    public x = 0,
    public y = 0,
  ) {
    this.img.src = imgSrc
  }

  /**
   * 将精灵图绘制在canvas上
   */
  drawToCanvas (ctx: CanvasRenderingContext2D) {
    if (!this.visible) return

    ctx.drawImage(
      this.img,
      this.x,
      this.y,
      this.width,
      this.height,
    )
  }

  /**
   * 简单的碰撞检测定义：
   * 另一个精灵的中心点处于本精灵所在的矩形内即可
   */
  isCollideWith (sp: Sprite) {
    if (!this.visible || !sp.visible) return false

    const spX = sp.x + sp.width / 2
    const spY = sp.y + sp.height / 2
    return this.x <= spX && spX <= this.x + this.width
      && this.y <= spY && spY <= this.y + this.height
  }
}
