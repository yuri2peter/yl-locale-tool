const { app, BrowserWindow } = require('electron');

let mainWindow;

require('./app')(function (url) {
  app.on('ready', function createWindow () {
    mainWindow = new BrowserWindow({ width: 1200, height: 900 });
    mainWindow.loadURL(url);
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
      mainWindow = null
    })
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});
