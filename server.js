#!/usr/bin/env node

import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { extname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 8080;
const DIST_DIR = resolve(__dirname, 'dist');

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(filePath, res) {
  try {
    if (!existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const stats = statSync(filePath);
    if (!stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const content = readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
  } catch (error) {
    console.error('Error serving file:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Server Error');
  }
}

function getFilePath(url) {
  // Remove query string and hash
  const path = url.split('?')[0].split('#')[0];
  
  // Remove leading slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // If path is empty, serve index.html
  if (!cleanPath) {
    return join(DIST_DIR, 'index.html');
  }
  
  // Check if the requested file exists
  const filePath = join(DIST_DIR, cleanPath);
  
  // If file exists and is a file (not directory), serve it
  if (existsSync(filePath)) {
    try {
      const stats = statSync(filePath);
      if (stats.isFile()) {
        return filePath;
      }
    } catch (error) {
      // If we can't stat it, fall through to index.html
    }
  }
  
  // For SPA routing (React Router), serve index.html for all routes
  // This handles client-side routing - React Router will handle the routing
  return join(DIST_DIR, 'index.html');
}

const server = createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const filePath = getFilePath(req.url);
  serveFile(filePath, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving files from: ${DIST_DIR}`);
  
  if (!existsSync(DIST_DIR)) {
    console.error(`ERROR: dist directory does not exist at ${DIST_DIR}`);
    console.error('Make sure the build completed successfully.');
    process.exit(1);
  }
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
