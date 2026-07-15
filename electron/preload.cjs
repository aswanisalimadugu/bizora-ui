const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('bizoraDesktop', true);
