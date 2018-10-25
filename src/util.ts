
/**
 * 返回不超出min和max之间的val值
 *
 * @export
 */
export function clamp (val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

/**
 * 返回from到to之间的随机浮点数
 *
 * @export
 */
export function rand (from: number, to: number) {
  return Math.random() * (to - from) + from
}

/**
 * 返回格式化的数字字符串形式，支持1000T以内的数
 *
 * @export
 */
export function format (num: number, precision = 3) {
  if (num < 1000) {
    return num.toFixed(0)
  } else {
    const units = ['K', 'M', 'B', 'T']
    const level = Math.min(units.length, Math.floor(Math.log10(num) / 3))
    num /= 1000 ** level
    if (num > 99) precision = Math.max(3, precision)
    return `${ num.toPrecision(precision) }${ units[level - 1] }`
  }
}

/**
 * 延迟给定的毫秒数。需要和await配合使用
 *
 * @export
 */
export function delay (time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

/**
 * 仅有确认的提示型弹窗
 *
 * @export
 */
export function confirmModal (title: string, content: string) {
  return wxp.showModal({
    title,
    content,
    showCancel: false,
    confirmText: '知道了',
  })
}

/**
 * 纯文本toast
 *
 * @export
 */
export function textToast (title: string) {
  wx.showToast({ icon: 'none', title })
}

/**
 * 尝试对所有string字段进行数值类型转换
 *
 * @export
 */
export function normalize (data: any): any {
  if (typeof data === 'string') {
    return isNaN(+data) ? data : +data
  } else if (Array.isArray(data)) {
    return data.map(normalize)
  } else if (data instanceof Object) {
    // NOTE: typeof null === 'object
    Object.entries(data).forEach(([k, v]) => {
      data[k] = normalize(v)
    })
    return data
  } else {
    return data
  }
}

/**
 * 从数组中随机选择一项后返回
 *
 * @export
 */
export function randChoose<T> (arr: T[]): [T, number] {
  const i = Math.floor(Math.random() * arr.length)
  if (i === -1) throw new Error('randChoose 空数组')
  return [arr[i], i]
}

/**
 * 重复op操作num次
 *
 * @export
 */
export function repeat (num: number, op: () => void) {
  for (let _ = 0; _ < num; _++) op()
}
