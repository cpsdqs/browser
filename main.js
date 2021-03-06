const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const createMenu = require('./menu')

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      blinkFeatures: 'CustomElementsV1'
    },
    vibrancy: 'dark',
    transparent: process.platform !== 'darwin',
    backgroundColor: process.platform !== 'darwin' ? '#222a' : undefined
  })

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', () => {
  createWindow()
  createMenu()
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
