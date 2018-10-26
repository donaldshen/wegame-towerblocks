/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 * ----------------------------------------------
 *
 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
 * Thank you all, you're awesome!
 */
class _Group {
  _tweens = {}
  _tweensAddedDuringUpdate = {}

  getAll () {
    return Object.values(this._tweens)
  }

  removeAll () {
    this._tweens = {}
  }

  add (tween) {
    this._tweens[tween.id] = tween
    this._tweensAddedDuringUpdate[tween.id] = tween
  }

  remove (tween) {
    delete this._tweens[tween.id]
    delete this._tweensAddedDuringUpdate[tween.id]
  }

  update (time = TWEEN.now(), preserve) {
    let tweenIds = Object.keys(this._tweens)

    if (!tweenIds.length) return false

    // Tweens are updated in "batches". If you add a new tween during an update, then the
    // new tween will be updated in the next batch.
    // If you remove a tween during an update, it may or may not be updated. However,
    // if the removed tween was added during the current batch, then it will not be updated.
    while (tweenIds.length) {
      this._tweensAddedDuringUpdate = {}

      tweenIds.forEach((id) => {
        const tween = this._tweens[id]
        if (tween && !tween.update(time)) {
          tween.isPlaying = false
          if (!preserve) delete this._tweens[id]
        }
      })

      tweenIds = Object.keys(this._tweensAddedDuringUpdate)
    }

    return true
  }
}

const TWEEN = new _Group()

TWEEN.Group = _Group
TWEEN.nextId = (() => {
  let id = 0
  return () => id++
})()

TWEEN.now = (() => {
  // Include a performance.now polyfill.
  // In node.js, use process.hrtime.
  if (typeof process === 'object') {
    return () => {
      // Convert [seconds, nanoseconds] to milliseconds.
      const [s, ns] = process.hrtime()
      return s * 1000 + ns * (0.1 ** 6)
    }
  } else {
    // NOTE: IE11+
    return () => window.performance.now()
  }
})()

TWEEN.Tween = class {
  constructor (object, group) {
    this._object = object
    this._valuesStart = {}
    this._valuesEnd = {}
    this._valuesStartRepeat = {}
    this._duration = 1000
    this._repeat = 0
    this._repeatDelayTime = undefined
    this._yoyo = false
    this.isPlaying = false
    this._reversed = false
    this._delayTime = 0
    this._startTime = null
    this._easingFunction = TWEEN.Easing.Linear.None
    this._interpolationFunction = TWEEN.Interpolation.Linear
    this._chainedTweens = []
    this._onStartCallback = null
    this._onStartCallbackFired = false
    this._onUpdateCallback = null
    this._onCompleteCallback = null
    this._onStopCallback = null
    this._group = group || TWEEN
    this.id = TWEEN.nextId()
  }

  to (properties, duration = 1000) {
    this._valuesEnd = properties
    this._duration = duration

    return this
  }
  // FUCK: 重构到这，凑合用
  start (time = TWEEN.now()) {
    this._group.add(this)

    this.isPlaying = true

    this._onStartCallbackFired = false

    this._startTime = typeof time === 'string' ? TWEEN.now() + parseFloat(time) : time
    this._startTime += this._delayTime

    for (let property in this._valuesEnd) {
      // Check if an Array was provided as property value
      if (this._valuesEnd[property] instanceof Array) {
        if (this._valuesEnd[property].length === 0) {
          continue
        }

        // Create a local copy of the Array with the start value at the front
        this._valuesEnd[property] = [this._object[property]].concat(this._valuesEnd[property])
      }

      // If `to()` specifies a property that doesn't exist in the source object,
      // we should not set that property in the object
      if (this._object[property] === undefined) {
        continue
      }

      // Save the starting value.
      this._valuesStart[property] = this._object[property]

      if ((this._valuesStart[property] instanceof Array) === false) {
        this._valuesStart[property] *= 1.0 // Ensures we're using numbers, not strings
      }

      this._valuesStartRepeat[property] = this._valuesStart[property] || 0
    }

    return this
  }

  stop () {
    if (!this.isPlaying) {
      return this
    }

    this._group.remove(this)
    this.isPlaying = false

    if (this._onStopCallback !== null) {
      this._onStopCallback(this._object)
    }

    this.stopChainedTweens()
    return this
  }

  end () {
    this.update(this._startTime + this._duration)
    return this
  }

  stopChainedTweens () {
    for (let i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
      this._chainedTweens[i].stop()
    }
  }

  group (group) {
    this._group = group
    return this
  }

  delay (amount) {
    this._delayTime = amount
    return this
  }

  repeat (times) {
    this._repeat = times
    return this
  }

  repeatDelay (amount) {
    this._repeatDelayTime = amount
    return this
  }

  yoyo (yy) {
    this._yoyo = yy
    return this
  }

  easing (eas) {
    this._easingFunction = eas
    return this
  }

  interpolation (inter) {
    this._interpolationFunction = inter
    return this
  }

  chain () {
    this._chainedTweens = arguments
    return this
  }

  onStart (callback) {
    this._onStartCallback = callback
    return this
  }

  onUpdate (callback) {
    this._onUpdateCallback = callback
    return this
  }

  onComplete (callback) {
    this._onCompleteCallback = callback
    return this
  }

  onStop (callback) {
    this._onStopCallback = callback
    return this
  }

  update (time) {
    let property
    let elapsed
    let value

    if (time < this._startTime) {
      return true
    }

    if (this._onStartCallbackFired === false) {
      if (this._onStartCallback !== null) {
        this._onStartCallback(this._object)
      }

      this._onStartCallbackFired = true
    }

    elapsed = (time - this._startTime) / this._duration
    elapsed = (this._duration === 0 || elapsed > 1) ? 1 : elapsed

    value = this._easingFunction(elapsed)

    for (property in this._valuesEnd) {
      // Don't update properties that do not exist in the source object
      if (this._valuesStart[property] === undefined) {
        continue
      }

      let start = this._valuesStart[property] || 0
      let end = this._valuesEnd[property]

      if (end instanceof Array) {
        this._object[property] = this._interpolationFunction(end, value)
      } else {
        // Parses relative end values with start as base (e.g.: +10, -3)
        if (typeof (end) === 'string') {
          if (end.charAt(0) === '+' || end.charAt(0) === '-') {
            end = start + parseFloat(end)
          } else {
            end = parseFloat(end)
          }
        }

        // Protect against non numeric properties.
        if (typeof (end) === 'number') {
          this._object[property] = start + (end - start) * value
        }
      }
    }

    if (this._onUpdateCallback !== null) {
      this._onUpdateCallback(this._object)
    }

    if (elapsed === 1) {
      if (this._repeat > 0) {
        if (isFinite(this._repeat)) {
          this._repeat--
        }

        // Reassign starting values, restart by making startTime = now
        for (property in this._valuesStartRepeat) {
          if (typeof (this._valuesEnd[property]) === 'string') {
            this._valuesStartRepeat[property] = this._valuesStartRepeat[property] + parseFloat(this._valuesEnd[property])
          }

          if (this._yoyo) {
            let tmp = this._valuesStartRepeat[property]

            this._valuesStartRepeat[property] = this._valuesEnd[property]
            this._valuesEnd[property] = tmp
          }

          this._valuesStart[property] = this._valuesStartRepeat[property]
        }

        if (this._yoyo) {
          this._reversed = !this._reversed
        }

        if (this._repeatDelayTime !== undefined) {
          this._startTime = time + this._repeatDelayTime
        } else {
          this._startTime = time + this._delayTime
        }

        return true
      } else {
        if (this._onCompleteCallback !== null) {
          this._onCompleteCallback(this._object)
        }

        for (let i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
          // Make the chained tweens start exactly at the time they should,
          // even if the `update()` method was called way past the duration of the tween
          this._chainedTweens[i].start(this._startTime + this._duration)
        }

        return false
      }
    }

    return true
  }
}

TWEEN.Easing = {

  Linear: {

    None: function (k) {
      return k
    },

  },

  Quadratic: {

    In: function (k) {
      return k * k
    },

    Out: function (k) {
      return k * (2 - k)
    },

    InOut: function (k) {
      if ((k *= 2) < 1) {
        return 0.5 * k * k
      }

      return -0.5 * (--k * (k - 2) - 1)
    },

  },

  Cubic: {

    In: function (k) {
      return k * k * k
    },

    Out: function (k) {
      return --k * k * k + 1
    },

    InOut: function (k) {
      if ((k *= 2) < 1) {
        return 0.5 * k * k * k
      }

      return 0.5 * ((k -= 2) * k * k + 2)
    },

  },

  Quartic: {

    In: function (k) {
      return k * k * k * k
    },

    Out: function (k) {
      return 1 - (--k * k * k * k)
    },

    InOut: function (k) {
      if ((k *= 2) < 1) {
        return 0.5 * k * k * k * k
      }

      return -0.5 * ((k -= 2) * k * k * k - 2)
    },

  },

  Quintic: {

    In: function (k) {
      return k * k * k * k * k
    },

    Out: function (k) {
      return --k * k * k * k * k + 1
    },

    InOut: function (k) {
      if ((k *= 2) < 1) {
        return 0.5 * k * k * k * k * k
      }

      return 0.5 * ((k -= 2) * k * k * k * k + 2)
    },

  },

  Sinusoidal: {

    In: function (k) {
      return 1 - Math.cos(k * Math.PI / 2)
    },

    Out: function (k) {
      return Math.sin(k * Math.PI / 2)
    },

    InOut: function (k) {
      return 0.5 * (1 - Math.cos(Math.PI * k))
    },

  },

  Exponential: {

    In: function (k) {
      return k === 0 ? 0 : Math.pow(1024, k - 1)
    },

    Out: function (k) {
      return k === 1 ? 1 : 1 - Math.pow(2, -10 * k)
    },

    InOut: function (k) {
      if (k === 0) {
        return 0
      }

      if (k === 1) {
        return 1
      }

      if ((k *= 2) < 1) {
        return 0.5 * Math.pow(1024, k - 1)
      }

      return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2)
    },

  },

  Circular: {

    In: function (k) {
      return 1 - Math.sqrt(1 - k * k)
    },

    Out: function (k) {
      return Math.sqrt(1 - (--k * k))
    },

    InOut: function (k) {
      if ((k *= 2) < 1) {
        return -0.5 * (Math.sqrt(1 - k * k) - 1)
      }

      return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1)
    },

  },

  Elastic: {

    In: function (k) {
      if (k === 0) {
        return 0
      }

      if (k === 1) {
        return 1
      }

      return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI)
    },

    Out: function (k) {
      if (k === 0) {
        return 0
      }

      if (k === 1) {
        return 1
      }

      return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1
    },

    InOut: function (k) {
      if (k === 0) {
        return 0
      }

      if (k === 1) {
        return 1
      }

      k *= 2

      if (k < 1) {
        return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI)
      }

      return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1
    },

  },

  Back: {

    In: function (k) {
      let s = 1.70158

      return k * k * ((s + 1) * k - s)
    },

    Out: function (k) {
      let s = 1.70158

      return --k * k * ((s + 1) * k + s) + 1
    },

    InOut: function (k) {
      let s = 1.70158 * 1.525

      if ((k *= 2) < 1) {
        return 0.5 * (k * k * ((s + 1) * k - s))
      }

      return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2)
    },

  },

  Bounce: {

    In: function (k) {
      return 1 - TWEEN.Easing.Bounce.Out(1 - k)
    },

    Out: function (k) {
      if (k < (1 / 2.75)) {
        return 7.5625 * k * k
      } else if (k < (2 / 2.75)) {
        return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75
      } else if (k < (2.5 / 2.75)) {
        return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375
      } else {
        return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375
      }
    },

    InOut: function (k) {
      if (k < 0.5) {
        return TWEEN.Easing.Bounce.In(k * 2) * 0.5
      }

      return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5
    },

  },

}

TWEEN.Interpolation = {

  Linear: function (v, k) {
    let m = v.length - 1
    let f = m * k
    let i = Math.floor(f)
    let fn = TWEEN.Interpolation.Utils.Linear

    if (k < 0) {
      return fn(v[0], v[1], f)
    }

    if (k > 1) {
      return fn(v[m], v[m - 1], m - f)
    }

    return fn(v[i], v[i + 1 > m ? m : i + 1], f - i)
  },

  Bezier: function (v, k) {
    let b = 0
    let n = v.length - 1
    let pw = Math.pow
    let bn = TWEEN.Interpolation.Utils.Bernstein

    for (let i = 0; i <= n; i++) {
      b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i)
    }

    return b
  },

  CatmullRom: function (v, k) {
    let m = v.length - 1
    let f = m * k
    let i = Math.floor(f)
    let fn = TWEEN.Interpolation.Utils.CatmullRom

    if (v[0] === v[m]) {
      if (k < 0) {
        i = Math.floor(f = m * (1 + k))
      }

      return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i)
    } else {
      if (k < 0) {
        return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0])
      }

      if (k > 1) {
        return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m])
      }

      return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i)
    }
  },

  Utils: {

    Linear: function (p0, p1, t) {
      return (p1 - p0) * t + p0
    },

    Bernstein: function (n, i) {
      let fc = TWEEN.Interpolation.Utils.Factorial

      return fc(n) / fc(i) / fc(n - i)
    },

    Factorial: (function () {
      let a = [1]

      return function (n) {
        let s = 1

        if (a[n]) {
          return a[n]
        }

        for (let i = n; i > 1; i--) {
          s *= i
        }

        a[n] = s
        return s
      }
    })(),

    CatmullRom: function (p0, p1, p2, p3, t) {
      let v0 = (p2 - p0) * 0.5
      let v1 = (p3 - p1) * 0.5
      let t2 = t * t
      let t3 = t * t2

      return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1
    },

  },

};

// UMD (Universal Module Definition)
(function (root) {
  /* eslint-disable no-undef */
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], () => TWEEN)
    /* eslint-enable no-undef */
  } else if (typeof module !== 'undefined' && typeof exports === 'object') {
    // Node.js
    module.exports = TWEEN
  } else if (root) {
    // Global variable
    root.TWEEN = TWEEN
  }
})(this)
