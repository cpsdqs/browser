const {Menu} = require('electron')

module.exports = function () {
  let template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click (item, window) { window.webContents.send('reload') }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+CmdOrCtrl+I',
          click (item, window) { window.webContents.send('toggle-dev-tools') }
        },
        { type: 'separator' },
        { role: 'reload', accelerator: 'Shift+CmdOrCtrl+R' },
        { role: 'forcereload', accelerator: 'Shift+Alt+CmdOrCtrl+R' },
        { role: 'toggledevtools', accelerator: 'Shift+Alt+CmdOrCtrl+I' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'History',
      submenu: [
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+[',
          click (item, window) { window.webContents.send('history-back') }
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          click (item, window) { window.webContents.send('history-forward') }
        },
        { type: 'separator' },
        {
          label: 'Location...',
          accelerator: 'CmdOrCtrl+L',
          click (item, window) { window.webContents.send('focus-location') }
        }
      ]
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          enabled: false
        }
      ]
    }
  ]
  if (process.platform === 'darwin') {
    template.unshift({
      label: 'Browser',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })
    template[1].submenu.push(
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [
          { role: 'startspeaking' },
          { role: 'stopspeaking' }
        ]
      }
    )
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ]
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
