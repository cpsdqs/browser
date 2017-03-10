const SpringAnimator = require('./spring-animator')

const strNeq = (value, template, match = 0) => {
  return value !== match ? template.split('#').join(value) : ''
}

module.exports = class TransformAnimator {
  constructor (element) {
    this.translateX = new SpringAnimator()
    this.translateY = new SpringAnimator()
    this.scaleX = new SpringAnimator(undefined, undefined, 1)
    this.scaleY = new SpringAnimator(undefined, undefined, 1)
    this.skewX = new SpringAnimator()
    this.skewY = new SpringAnimator()
    this.rotateZ = new SpringAnimator()
    this.opacity = new SpringAnimator(undefined, undefined, 1)

    this.properties = [
      'translateX', 'translateY',
      'scaleX', 'scaleY',
      'skewX', 'skewY',
      'rotateZ',
      'opacity'
    ]

    this.element = element || null

    this.autoApply = true

    for (let property of this.properties) {
      this[property].on('update', () => {
        if (this.autoApply) this.apply()
      })
    }
  }
  get transform () {
    let transform = ''
    transform += strNeq(this.translateX.position, ' translateX(#px)')
    transform += strNeq(this.translateY.position, ' translateY(#px)')
    transform += strNeq(this.scaleX.position, ' scaleX(#)', 1)
    transform += strNeq(this.scaleY.position, ' scaleY(#)', 1)
    transform += strNeq(this.skewX.position, ' skewX(#rad)')
    transform += strNeq(this.skewY.position, ' skewY(#rad)')
    transform += strNeq(this.rotateZ.position, ' rotateZ(#rad)')
    return transform.trim()
  }
  set transform (v) {}
  get opacityValue () {
    return `${this.opacity.position === 1 ? '' : this.opacity.position}`
  }
  set opacityValue (v) {}
  apply (element) {
    element = element || this.element
    if (!element) return
    element.style.transform = this.transform
    if (this.opacity) element.style.opacity = this.opacityValue
  }
}
