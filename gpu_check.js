import { app } from 'electron';

// Forzamos los mismos flags que usa BMO
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-transparent-visuals');

app.whenReady().then(async () => {
  console.log("\n=========================================");
  console.log("🖥️  REPORTE DE TARJETA GRÁFICA / WEBGL");
  console.log("=========================================\n");
  
  const status = app.getGPUFeatureStatus();
  console.log("ESTADO DE FUNCIONES GPU EN ELECTRON:");
  console.dir(status, { colors: true });

  console.log("\n=========================================\n");
  app.quit();
});
