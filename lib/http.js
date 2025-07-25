'use strict'

const http = require('http')
const async = require('async')

class HttpMock {
  constructor () {
    this.routes = {}
    this.server = null
  }

  // Add a mock route
  addRoute (route, handler) {
    if (!route || typeof handler !== 'function') {
      throw new Error('ERR_HTTP_MISSING_ROUTE_OR_HANDLER')
    }

    this.routes[route] = handler
  }

  // Start the mock HTTP server
  start (port, cb = () => {}) {
    if (!port) {
      throw new Error('ERR_HTTP_MISSING_PORT')
    }

    this.server = http.createServer((req, res) => {
      const handler = this.routes[req.url]
      if (!handler) {
        res.statusCode = 404
        return res.end('ERR_HTTP_ROUTE_NOT_FOUND')
      }

      handler(req, res)
    })

    this.server.listen(port, cb)
    return new Promise((resolve, reject) => {
      this.server.on('listening', resolve)
      this.server.on('error', reject)
    })
  }

  // Stop the mock HTTP server
  stop (cb = () => {}) {
    if (!this.server) {
      throw new Error('ERR_HTTP_SERVER_NOT_RUNNING')
    }

    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err)
        } else {
          this.server = null
          resolve()
        }
      })
    })
  }
}

module.exports = HttpMock
