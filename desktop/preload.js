const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('doctorBookingDesktop', {
  platform: process.platform,
});
