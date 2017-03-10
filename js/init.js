const {ipcRenderer: ipc} = require('electron')
const Browser = require('./browser')
const SpringAnimator = require('./spring-animator')
const TransformAnimator = require('./transform-animator')

let browsers = []
let selected = 0
let activeBrowser
let overviewAnimator = new SpringAnimator(100, 20, 0, value => {
  for (let i in browsers) {
    let browser = browsers[i]
    if (+i === selected) {
      browser.transform.scaleX.setValue(1 - value / 2)
      browser.transform.scaleY.setValue(1 - value / 2)
      browser.transform.opacity.setValue(1)
    } else {
      browser.transform.scaleX.setValue(0.3 + value / 5)
      browser.transform.scaleY.setValue(0.3 + value / 5)
      browser.transform.opacity.setValue(value)
    }
    if (value > 0.4) browser.classList.add('no-events')
    else browser.classList.remove('no-events')
  }
})
let scrollAnimator = new SpringAnimator(100, 20, 0, value => {
  scrollAnimator.value = Math.min(browsers.length - 1, scrollAnimator.value)
  scrollAnimator.value = Math.max(0, scrollAnimator.value)
  selected = scrollAnimator.value
  activeBrowser = browsers[selected]

  let scale = 1 - overviewAnimator.position / 2
  for (let i in browsers) {
    let browser = browsers[i]
    let offset = +i - value
    let poffset = window.innerWidth * offset * scale
    browser.transform.translateX.setValue(poffset, true)
  }
})
overviewAnimator.on('update', () => scrollAnimator.start())

let createBrowser = function (url = 'about:blank') {
  const browser = new Browser()
  document.body.appendChild(browser)
  browser.transform = new TransformAnimator(browser)
  browser.url = url
  browser.update()
  browser.load()
  browsers.push(browser)
  browser.on('overview', e => {
    overviewAnimator.setValue(1)
  })
  browser.on('new-window', e => {
    overviewAnimator.setValue(0.3)
    setTimeout(() => {
      overviewAnimator.setValue(0)
    }, 300)
    let nbrowser = createBrowser(e.url)
    if (e.disposition === 'foreground-tab' || e.disposition === 'new-window') {
      scrollAnimator.setValue(browsers.indexOf(nbrowser))
    }
  })
  browser.addEventListener('click', e => {
    if (overviewAnimator.position > 0.4) {
      if (e.target === browser.overviewButton) {
        browser.transform.scaleX.setValue(0)
        browser.transform.scaleY.setValue(0)
        browser.transform.opacity.setValue(0)
        setTimeout(() => {
          browsers.splice(browsers.indexOf(browser), 1)
          document.body.removeChild(browser)
          if (browsers.length === 0) {
            overviewAnimator.setValue(0, true)
            createBrowser()
          }
          scrollAnimator.start()
        }, 300)
      } else {
        scrollAnimator.setValue(browsers.indexOf(browser))
        overviewAnimator.setValue(0)
      }
    }
  })
  return browser
}
createBrowser()
scrollAnimator.start()

ipc.on('reload', () => activeBrowser.reload())
ipc.on('toggle-dev-tools', () => activeBrowser.toggleDevTools())
ipc.on('history-back', () => activeBrowser.back())
ipc.on('history-forward', () => activeBrowser.forward())
ipc.on('focus-location', () => activeBrowser.focusLocation())
