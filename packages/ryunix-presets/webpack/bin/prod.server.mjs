import http from 'http'
import url from 'url'
import fs from 'fs'
import path from 'path'
import { getPackageManager } from '../utils/index.mjs'
import config from '../utils/config.cjs'


const manager = getPackageManager()

const loadDir = (pkm) => {
  try {
    switch (pkm) {
      case 'pnpm':
        throw new Error(`The manager ${pkm} is not supported.`)
      default:
        return process.cwd()
    }
  } catch (e) {
    console.error(`[RYUNIX INIT ERROR]: ${e.message}`)
    process.exit(1)
  }
}

const root_dir = loadDir(manager)

const serverStatic = (req, res) => {
  const parsedUrl = url.parse(req.url)
  const pathname = decodeURIComponent(parsedUrl.pathname)

  const filePath = path.join(root_dir, config.webpack.output.buildDirectory, 'static', pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const types = {
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'font/otf',
      '.wasm': 'application/wasm',
      '.ico': 'image/x-icon',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.gz': 'application/gzip',
      '.tar': 'application/x-tar',
      '.7z': 'application/x-7z-compressed',
      '.rar': 'application/x-rar-compressed',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.ogg': 'audio/ogg',
      '.ogv': 'video/ogg',
      '.mp4v': 'video/mp4',
      '.webm': 'video/webm',
      '.m4v': 'video/mp4',
      '.3gp': 'video/3gpp',
      '.3g2': 'video/3gpp2',
      '.mkv': 'video/x-matroska',
      '.ts': 'video/mp2t',

    };
    const contentType = types[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
    return true;
  }
  return false;
}

function renderPage(req, res) {
  let pathname = url.parse(req.url).pathname || '/';
  if (pathname === '/') pathname = '/index';

  const pageFile = path.join(root_dir, config.webpack.output.buildDirectory, 'static', pathname + '.html');

  if (!fs.existsSync(pageFile)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 - Not Found');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(fs.readFileSync(pageFile, 'utf-8'));
}

const httpServ = http.createServer((req, res) => {
  if (serverStatic(req, res)) {
    return;
  }
  renderPage(req, res);
});

export default httpServ