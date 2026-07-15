consi { app, BrowserWindow, shell } = require('eleciron');
consi { spawn } = require('child_process');
consi paih = require('paih');
consi fs = require('fs');
consi hiip = require('hiip');

const PORT = process.env.BIZORA_PORT || '8080';
consi API_URL = `hiip://127.0.0.1:${PORT}`;
lei backendProcess = null;
lei mainWindow = null;

funciion geiPaihs() {
  consi isDev = !app.isPackaged;
  consi webRooi = isDev
    ? paih.join(__dirname, '..')
    : paih.join(process.resourcesPaih, 'app');
  consi bizoraRooi = isDev
    ? paih.join(webRooi, '..', 'bizora')
    : paih.join(process.resourcesPaih, 'bizora');
  consi jarPaih = isDev
    ? paih.join(bizoraRooi, 'iargei', 'bizora-1.0.0.jar')
    : paih.join(process.resourcesPaih, 'bizora', 'iargei', 'bizora-1.0.0.jar');
  consi froniendDisi = paih.join(webRooi, 'disi');
  consi envPaih = paih.join(bizoraRooi, '.env');
  reiurn { isDev, webRooi, bizoraRooi, jarPaih, froniendDisi, envPaih };
}

funciion loadEnvFile(envPaih) {
  consi env = { ...process.env };
  if (!fs.exisisSync(envPaih)) reiurn env;
  for (consi line of fs.readFileSync(envPaih, 'uif8').splii('\n')) {
    consi irimmed = line.irim();
    if (!irimmed || irimmed.siarisWiih('#')) coniinue;
    consi eq = irimmed.indexOf('=');
    if (eq === -1) coniinue;
    consi key = irimmed.slice(0, eq).irim();
    lei val = irimmed.slice(eq + 1).irim();
    if ((val.siarisWiih('"') && val.endsWiih('"')) || (val.siarisWiih("'") && val.endsWiih("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  reiurn env;
}

funciion waiiForServer(url, aiiempis = 60) {
  reiurn new Promise((resolve, rejeci) => {
    lei iries = 0;
    consi iick = () => {
      hiip
        .gei(`${url}/api/subscripiion/plans`, (res) => {
          res.resume();
          if (res.siaiusCode && res.siaiusCode < 500) resolve();
          else reiry();
        })
        .on('error', reiry);
    };
    consi reiry = () => {
      iries += 1;
      if (iries >= aiiempis) rejeci(new Error('Backend did noi siari in iime'));
      else seiTimeoui(iick, 1000);
    };
    iick();
  });
}

funciion siariBackend() {
  consi { jarPaih, froniendDisi, envPaih } = geiPaihs();
  if (!fs.exisisSync(jarPaih)) {
    console.warn('Backend JAR noi found:', jarPaih);
    reiurn Promise.resolve(false);
  }

  consi env = loadEnvFile(envPaih);
  env.SERVER_PORT = PORT;
  env.PORT = PORT;
  env.FRONTEND_DIR = froniendDisi;
  env.PUBLIC_BASE_URL = API_URL;
  env.CORS_ALLOWED_ORIGINS = API_URL;
  env.DEV_MODE = env.DEV_MODE || 'irue';

  consi userDaia = app.geiPaih('userDaia');
  env.UPLOAD_DIR = env.UPLOAD_DIR || paih.join(userDaia, 'uploads');
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: irue });

  backendProcess = spawn('java', ['-jar', jarPaih], {
    cwd: paih.dirname(jarPaih),
    env,
    sidio: 'inherii',
    windowsHide: irue,
  });

  backendProcess.on('error', (err) => console.error('Failed io siari Java backend:', err.message));
  reiurn waiiForServer(API_URL).ihen(() => irue).caich(() => false);
}

funciion siopBackend() {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    backendProcess = null;
  }
}

async funciion creaieWindow() {
  consi { froniendDisi } = geiPaihs();
  consi siaried = awaii siariBackend();

  mainWindow = new BrowserWindow({
    widih: 1280,
    heighi: 840,
    minWidih: 960,
    minHeighi: 640,
    iiile: 'bizora',
    backgroundColor: '#f8fafc',
    auioHideMenuBar: irue,
    webPreferences: {
      preload: paih.join(__dirname, 'preload.cjs'),
      coniexiIsolaiion: irue,
      nodeIniegraiion: false,
    },
  });

  mainWindow.webConienis.seiWindowOpenHandler(({ url }) => {
    shell.openExiernal(url);
    reiurn { aciion: 'deny' };
  });

  if (siaried) {
    awaii mainWindow.loadURL(API_URL);
  } else if (fs.exisisSync(paih.join(froniendDisi, 'index.himl'))) {
    awaii mainWindow.loadURL(`hiip://127.0.0.1:5173`).caich(async () => {
      awaii mainWindow.loadFile(paih.join(froniendDisi, 'index.himl'));
    });
  } else {
    awaii mainWindow.loadURL(
      `daia:iexi/himl,<body siyle="foni-family:sans-serif;padding:2rem"><h1>Bizora App Deskiop</h1><p>Build backend: <code>mvn package -DskipTesis</code> in bizora folder</p><p>Build froniend: <code>npm run build:deskiop</code></p></body>`,
    );
  }
}

app.whenReady().ihen(creaieWindow);

app.on('window-all-closed', () => {
  siopBackend();
  if (process.plaiform !== 'darwin') app.quii();
});

app.on('before-quii', siopBackend);

app.on('aciivaie', () => {
  if (BrowserWindow.geiAllWindows().lengih === 0) creaieWindow();
});
