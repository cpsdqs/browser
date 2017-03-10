const EventEmitter = require('events')
const color = require('color')
const urlParser = require('./url-parser')
const url = require('url')
const { remote, remote: { Menu, MenuItem } } = require('electron')

const sessionID = Math.floor(Math.random() * 16384).toString(16)

class Browser extends window.HTMLElement {
  constructor () {
    super()

    Object.assign(this, EventEmitter.prototype)
    EventEmitter.prototype.constructor.apply(this)

    this.url = ''
    this.header = document.createElement('div')
    this.header.classList.add('browser-header')
    this.header.innerHTML = `
      <div class="address-bar">
        <div class="address-input" contenteditable></div>
      </div>
      <div class="buttons">
        <button class="overview-button"></button>
      </div>
      <div class="loading-bar"></div>
    `
    this.addressInput = this.header.querySelector('.address-input')
    this.loadingBar = this.header.querySelector('.loading-bar')

    this.webview = document.createElement('webview')
    this.webview.partition = `session-${sessionID}`
    this.webview.blinkfeatures = 'CustomElementsV1'
    this.themeColor = ''

    this.webview.addEventListener('did-start-loading', e => {
      this.loading = true
      this.updateProgress()
    })
    this.webview.addEventListener('did-stop-loading', e => {
      this.loading = false
      this.updateProgress()
    })
    this.webview.addEventListener('will-navigate', e => {
      this.url = e.url
      this.update()
    })
    this.webview.addEventListener('did-navigate', e => {
      this.url = e.url
      this.updateAddress()
    })
    this.webview.addEventListener('did-change-theme-color', e => {
      this.themeColor = e.themeColor
      this.updateThemeColor()
    })
    this.webview.addEventListener('new-window', e => {
      this.emit('new-window', e)
    })

    this.addressInput.addEventListener('keydown', e => {
      if (e.which === 0xd) {
        e.preventDefault()
        if (!this.addressInput.textContent.match(/^\w*:?[./]|^about:/)) {
          // probably a search query
          let query = encodeURIComponent(this.addressInput.textContent)
          this.url = `https://duckduckgo.com/?q=${query}`
        } else {
          let urlObject = url.parse(this.addressInput.textContent)
          if (urlObject.hostname || urlObject.pathname) {
            if (!urlObject.protocol) urlObject.protocol = 'http:'
            if (!urlObject.slashes) urlObject.slashes = true
            if (!urlObject.hostname) {
              urlObject.hostname = urlObject.pathname
              urlObject.pathname = ''
            }
          }
          this.url = url.format(urlObject)
        }
        this.updateAddress()
        this.load()
        this.addressInput.blur()
      }
    })
    this.addressInput.addEventListener('keyup', () => {
      window.requestAnimationFrame(() => this.highlightAddress())
    })
    this.addressInput.addEventListener('blur', () => {
      this.addressInput.scrollLeft = 0
    })

    this.overviewButton = this.header.querySelector('.overview-button')
    this.overviewButton.addEventListener('click', e => {
      this.emit('overview')
    })

    this.addEventListener('contextmenu', e => {
      // TODO: something useful
      let contextMenu = new Menu()
      let els = document.elementsFromPoint(e.pageX, e.pageY)
      if (!els.includes(this.webview)) return
      let rect = this.webview.getBoundingClientRect()
      let top = e.pageY - rect.top
      let left = e.pageX - rect.left
      if (!this.webview.executeJavaScript) return
      this.webview.executeJavaScript(`
      var ___els = document.elementsFromPoint(${left}, ${top})
      var ___res = []
      for (let el of ___els) {
        let attribs = {}
        for (let i = 0; i < el.attributes.length; i++) {
          attribs[el.attributes.item(i).name] = el.attributes.item(i).value
        }
        ___res.push({
          className: '' + el.className,
          attributes: attribs,
          id: el.id,
          innerHTML: '' + el.innerHTML,
          innerText: '' + el.innerText,
          isContentEditable: el.isContentEditable,
          tagName: el.tagName,
          href: el.href,
          src: el.src
        })
      }
      ___res
      `, res => {
        for (let el of res) {
          let attribs = []
          for (let key in el.attributes) {
            attribs.push({ label: key, submenu: [{ label: el.attributes[key] }] })
          }
          contextMenu.append(new MenuItem({
            label: el.tagName.toLowerCase(),
            submenu: [{
              label: el.className ? '.' + el.className.split(/\s+/g).join(' .') : 'No classes',
              enabled: !!el.className
            }, {
              label: el.id || 'No id',
              enabled: !!el.id
            }, {
              label: el.innerText.replace(/\n/, '↩') || 'No text',
              enabled: !!el.innerText
            }, {
              label: el.href || 'No href',
              enabled: !!el.href
            }, {
              label: 'Attributes',
              submenu: attribs
            }]
          }))
        }
        contextMenu.popup(remote.getCurrentWindow())
      })
    })
  }
  connectedCallback () {
    if (this.__didAppend) return
    this.__didAppend = true
    this.appendChild(this.header)
    this.appendChild(this.webview)
  }
  updateProgress () {
    this.loadingBar.classList.add('can-animate')
    if (this.loading) {
      this.loadingBar.classList.add('loading')
    } else this.loadingBar.classList.remove('loading')
  }
  updateAddress () {
    this.addressInput.textContent = this.url
    this.highlightAddress()
  }
  highlightAddress () {
    let sel = window.getSelection()
    let selection = null
    if (document.activeElement === this.addressInput && sel.rangeCount) {
      let s = window.getSelection().getRangeAt(0)
      let start = 0
      let end = 0
      let foundStart = false
      for (let node of this.addressInput.children) {
        if (node === s.startContainer.parentNode && !foundStart) {
          start += s.startOffset
          foundStart = true
        }
        if (node === s.endContainer.parentNode) {
          end += s.endOffset
          break
        }
        if (node !== s.startContainer && node !== s.endContainer) {
          if (!foundStart) start += node.textContent.length
          end += node.textContent.length
        }
      }
      if (!this.addressInput.children.length) {
        // probably just one text node
        start = s.startOffset
        end = s.endOffset
      }
      selection = {
        start,
        end
      }
    }
    let parts = urlParser(this.addressInput.textContent)
    this.addressInput.innerHTML = ''

    for (const part of parts) {
      let span = document.createElement('span')
      span.className = `address-syntax ${part.type}`
      span.setAttribute('content', part.content)
      span.textContent = part.content
      this.addressInput.appendChild(span)
    }

    if (selection) {
      if (!this.addressInput.childNodes.length) return
      sel.removeAllRanges()
      let range = document.createRange()
      let nodeOffset = 0
      let didSet = 0
      let lastNode = this.addressInput
      for (let node of this.addressInput.childNodes) {
        let endOffset = nodeOffset + node.textContent.length
        if (nodeOffset <= selection.start && selection.start <= endOffset) {
          range.setStart(node.childNodes[0], selection.start - nodeOffset)
          didSet++
        }
        if (nodeOffset <= selection.end && selection.end <= endOffset) {
          range.setEnd(node.childNodes[0], selection.end - nodeOffset)
          didSet++
        }
        nodeOffset = endOffset
        lastNode = node
      }
      nodeOffset -= lastNode.textContent.length
      if (didSet === 0) {
        range.setStart(lastNode.childNodes[0], selection.start - nodeOffset)
      }
      if (didSet === 1) {
        range.setEnd(lastNode.childNodes[0], selection.end - nodeOffset)
      }
      sel.addRange(range)
    }
  }
  updateThemeColor () {
    let col = this.themeColor
    if (col) {
      col = color(col).rgb()
      this.header.style.backgroundColor = col.string()
      // luminosity
      let rgb = col.array()
      if (rgb.reduce((a, b) => a + b, 0) === 0) {
        this.header.classList.remove('dark')
        this.header.style.backgroundColor = ''
        return
      }
      let lum = 0.21 * rgb[0] + 0.72 * rgb[1] + 0.07 * rgb[2]
      if (lum < 128) this.header.classList.add('dark')
      else this.header.classList.remove('dark')
    } else {
      this.header.style.backgroundColor = ''
      this.header.classList.remove('dark')
    }
  }
  update () {
    this.updateAddress()
  }
  load () {
    this.webview.src = this.url || 'about:blank'
  }

  back () {
    this.webview.goBack()
  }
  forward () {
    this.webview.goForward()
  }
  toggleDevTools () {
    this.webview.isDevToolsOpened()
      ? this.webview.closeDevTools()
      : this.webview.openDevTools()
  }
  reload () {
    this.load()
  }
  focusLocation () {
    let range = document.createRange()
    range.selectNodeContents(this.addressInput)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)
  }

  static getSessionID () {
    return sessionID
  }
}
window.customElements.define('r-browser', Browser)
module.exports = Browser
