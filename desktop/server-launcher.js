const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');
const net = require('net');

const SERVER_PORT = 17890;
const SERVER_HOST = '127.0.0.1';
const APP_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

let phpProcess = null;
let onStatus = () => {};

function setStatusCallback(fn) {
  onStatus = fn || (() => {});
}

function status(msg) {
  onStatus(msg);
}

function getResourcesPath() {
  const { app } = require('electron');
  const candidates = [
    process.resourcesPath,
    path.join(path.dirname(process.execPath), 'resources'),
    path.join(__dirname, 'resources'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'server', 'artisan'))) {
      return candidate;
    }
  }
  return process.resourcesPath;
}

function getPaths() {
  const { app } = require('electron');
  const resourcesPath = getResourcesPath();
  const serverPath = path.join(resourcesPath, 'server');
  const userData = app.getPath('userData');
  const dbPath = path.join(userData, 'database.sqlite');

  const phpCandidates = [
    path.join(resourcesPath, 'php', 'php.exe'),
    'C:\\laragon\\bin\\php\\php-8.3.30-Win32-vs16-x64\\php.exe',
    'C:\\laragon\\bin\\php\\php-8.3.16-Win32-vs16-x64\\php.exe',
  ];

  let phpPath = null;
  for (const candidate of phpCandidates) {
    if (fs.existsSync(candidate)) {
      phpPath = candidate;
      break;
    }
  }

  const phpDir = phpPath ? path.dirname(phpPath) : null;

  return { serverPath, phpPath, phpDir, resourcesPath, dbPath, userData };
}

function phpEnv(phpDir, dbPath, userData) {
  return {
    ...process.env,
    PHPRC: phpDir,
    APP_ENV: 'local',
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: dbPath,
    SESSION_DRIVER: 'file',
    CACHE_STORE: 'file',
    QUEUE_CONNECTION: 'sync',
    LOG_CHANNEL: 'single',
    APP_URL: APP_URL,
  };
}

function ensureWritableDirs(serverPath, userData) {
  const dirs = [
    path.join(serverPath, 'storage', 'app', 'public'),
    path.join(serverPath, 'storage', 'framework', 'cache', 'data'),
    path.join(serverPath, 'storage', 'framework', 'sessions'),
    path.join(serverPath, 'storage', 'framework', 'views'),
    path.join(serverPath, 'storage', 'logs'),
    path.join(serverPath, 'bootstrap', 'cache'),
    userData,
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const DB_VERSION = '2'; // bump to reset AppData SQLite (clean desktop DB)

function syncDatabase(serverPath, dbPath, userData) {
  const versionFile = path.join(userData, 'db-version.txt');
  const bundledDb = path.join(serverPath, 'database', 'database.sqlite');
  const currentVersion = fs.existsSync(versionFile)
    ? fs.readFileSync(versionFile, 'utf8').trim()
    : '';

  if (currentVersion !== DB_VERSION && fs.existsSync(bundledDb)) {
    fs.copyFileSync(bundledDb, dbPath);
    fs.writeFileSync(versionFile, DB_VERSION);
    return 'loaded';
  }

  if (!fs.existsSync(dbPath) && fs.existsSync(bundledDb)) {
    fs.copyFileSync(bundledDb, dbPath);
    fs.writeFileSync(versionFile, DB_VERSION);
    return 'loaded';
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
    return 'empty';
  }

  return 'ready';
}

function runArtisan(phpPath, phpDir, serverPath, dbPath, userData, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(phpPath, ['artisan', ...args], {
      cwd: serverPath,
      windowsHide: true,
      env: phpEnv(phpDir, dbPath, userData),
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || stdout.trim() || `artisan ${args.join(' ')} failed`));
    });
  });
}

async function ensureDatabase(serverPath, phpPath, phpDir, dbPath, userData) {
  ensureWritableDirs(serverPath, userData);
  const dbState = syncDatabase(serverPath, dbPath, userData);

  if (dbState === 'loaded' || dbState === 'ready') {
    return;
  }

  status('Setting up SQLite database (first run)...');
  await runArtisan(phpPath, phpDir, serverPath, dbPath, userData, ['migrate', '--force']);
  await runArtisan(phpPath, phpDir, serverPath, dbPath, userData, ['db:seed', '--class=Database\\Seeders\\DesktopSeeder', '--force']);
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => tester.close(() => resolve(true)))
      .listen(port, SERVER_HOST);
  });
}

function waitForServer(maxAttempts = 120) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryUrl = (urlPath) => new Promise((res) => {
      const req = http.get(`${APP_URL}${urlPath}`, (resHttp) => {
        res(resHttp.statusCode >= 200 && resHttp.statusCode < 500);
      });
      req.on('error', () => res(false));
      req.setTimeout(3000, () => { req.destroy(); res(false); });
    });

    const check = async () => {
      attempts += 1;
      if (attempts % 4 === 0) {
        status(`Waiting for server... (${Math.min(attempts, maxAttempts)}/${maxAttempts})`);
      }

      const upOk = await tryUrl('/up');
      const homeOk = upOk ? true : await tryUrl('/');

      if (upOk || homeOk) {
        resolve();
        return;
      }
      if (attempts >= maxAttempts) {
        reject(new Error('Server did not respond. Port 17890 may be blocked or PHP failed to start.'));
        return;
      }
      setTimeout(check, 500);
    };

    check();
  });
}

async function startLocalServer() {
  const { serverPath, phpPath, phpDir, dbPath, userData } = getPaths();

  if (!fs.existsSync(path.join(serverPath, 'artisan'))) {
    throw new Error(`Server not found at: ${serverPath}`);
  }
  if (!phpPath || !phpDir) {
    throw new Error('PHP not found in the app bundle.');
  }

  status('Preparing SQLite database...');
  await ensureDatabase(serverPath, phpPath, phpDir, dbPath, userData);

  const portFree = await isPortFree(SERVER_PORT);
  if (!portFree) {
    status('Port busy — retrying...');
    await new Promise((r) => setTimeout(r, 1500));
  }

  status('Starting local server...');

  phpProcess = spawn(
    phpPath,
    ['artisan', 'serve', `--host=${SERVER_HOST}`, `--port=${SERVER_PORT}`, '--no-reload'],
    {
      cwd: serverPath,
      windowsHide: true,
      env: phpEnv(phpDir, dbPath, userData),
    }
  );

  let phpLog = '';
  phpProcess.stdout.on('data', (d) => { phpLog += d.toString(); });
  phpProcess.stderr.on('data', (d) => { phpLog += d.toString(); });

  phpProcess.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error('[php exited]', code, phpLog);
    }
  });

  status('Loading application...');
  await waitForServer();
  return APP_URL;
}

function stopLocalServer() {
  if (phpProcess && !phpProcess.killed) {
    try {
      phpProcess.kill('SIGTERM');
    } catch {
      phpProcess.kill();
    }
    phpProcess = null;
  }
}

module.exports = { startLocalServer, stopLocalServer, setStatusCallback, APP_URL, SERVER_PORT };
