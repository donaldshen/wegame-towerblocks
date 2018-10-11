/**
 * 简易的对象池实现
 * 用于对象的存贮和重复使用
 * 可以有效减少对象创建开销和避免频繁的垃圾回收
 * 提高游戏性能
 */
export default class Pool {

  poolDic: {[prop: string]: any} = {}

  /**
   * 根据对象标识符
   * 获取对应的对象池
   */
  getPoolBySign (name: string) {
    if (!(name in this.poolDic)) this.poolDic[name] = []
    return this.poolDic[name]
  }

  /**
   * 根据传入的对象标识符，查询对象池
   * 对象池为空创建新的类，否则从对象池中取
   */
  getItemByClass (name: string, className: {new(): any}) {
    const pool = this.getPoolBySign(name)

    return pool.length ? pool.shift() : new className()
  }

  /**
   * 将对象回收到对象池
   * 方便后续继续使用
   */
  recover (name: string, instance: object) {
    this.getPoolBySign(name).push(instance)
  }
}
