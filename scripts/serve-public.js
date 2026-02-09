#!/usr/bin/env node

/**
 * Tiny static server for ./public
 *
 * Usage:
 *   node scripts/serve-public.js        # default port 4173
 *   PORT=5000 node scripts/serve-public.js
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const publicDir = path.join(rootDir, 'public')
const port = Number(process.env.PORT || 4173)

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    ...headers,
  })
  res.end(body)
}

const server = http.createServer((req, res) => {
  const url = req.url || '/'
  const safePath = url.split('?')[0].replace(/\/+/g, '/')
  const filePath = path.join(publicDir, decodeURIComponent(safePath))

  if (!filePath.startsWith(publicDir)) {
    return send(res, 403, 'Forbidden')
  }

  fs.stat(filePath, (err, stat) => {
    if (err) {
      return send(res, 404, 'Not found')
    }

    const actualPath = stat.isDirectory()
      ? path.join(filePath, 'index.html')
      : filePath

    fs.readFile(actualPath, (readErr, data) => {
      if (readErr) {
        return send(res, 500, 'Error reading file')
      }

      const ext = path.extname(actualPath)
      const contentType =
        ext === '.json'
          ? 'application/json; charset=utf-8'
          : ext === '.html'
            ? 'text/html; charset=utf-8'
            : ext === '.js'
              ? 'text/javascript; charset=utf-8'
              : 'application/octet-stream'

      res.writeHead(200, { 'Content-Type': contentType })
      res.end(data)
    })
  })
})

server.listen(port, () => {
  console.log(`Serving ./public on http://localhost:${port}`)
})

