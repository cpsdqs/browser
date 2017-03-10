const EventEmitter = require('events')

let speed = 1

module.exports = class SpringAnimator extends EventEmitter {
  constructor (force = 300, decel = 20, initial = 0, callback = () => {}) {
    super()
    this.callback = callback
    this.force = force
    this.decel = decel

    this.position = initial
    this.velocity = 0
    this.lastTime = Date.now()
    this.stopThreshold = 0.005 // at which point to stop the loop

    this.loopFunction = () => { this.update() }

    this.looping = false

    this.value = initial
  }
  setPosition (x) {
    this.position = x
    this.start()
    return this
  }
  setVelocity (x) {
    this.velocity = x
    this.start()
    return this
  }
  setStopThreshold (x) {
    this.stopThreshold = x
    this.start()
    return this
  }

  update () {
    if (this.looping) window.requestAnimationFrame(this.loopFunction)

    let now = Date.now()
    let dt = (now - this.lastTime) / 1000 * speed
    this.lastTime = now
    let t = this.value
    let x = this.position
    let v = this.velocity
    let f = this.force
    let d = this.decel

    v = (v + f * dt * (t - x)) * (1 / (1 + d * dt))
    x += v * dt

    this.position = x
    this.velocity = v

    this.emit('update', this.position)
    this.callback(this.position)

    if (Math.abs(this.velocity) < this.stopThreshold &&
        Math.abs(this.position - this.value) < this.stopThreshold) {
      this.stop()
      this.position = this.value
    }
  }

  start () {
    if (this.looping) return
    this.looping = true
    this.lastTime = Date.now()
    this.update()
  }
  stop () {
    this.looping = false
  }
  setValue (x, position = false) {
    if (position) this.position = x
    if (x !== this.value) {
      this.value = x
      this.start()
    }
    return this
  }

  static setSpeed (x) {
    speed = +x || 1
  }
  static getSpeed () {
    return speed
  }
}
