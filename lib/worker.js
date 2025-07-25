'use strict'

const worker = require('bfx-svc-boot-js/lib/worker')

class Worker {
  constructor (conf, ctx) {
    this.conf = conf
    this.ctx = ctx
    this.name = ctx.wtype
    this.worker = null
  }

  async start (cb = () => {}) {
    return new Promise((resolve, reject) => {
      try {
        // Initialize the worker with the custom configuration
        this.worker = worker(this.conf, this.ctx)

        // Wait for worker to be fully initialized before resolving
        const checkReady = () => {
          // Check if HTTP server is listening (for HTTP workers)
          if (this.worker.httpd_h0 && this.worker.httpd_h0.server && this.worker.httpd_h0.server.listening) {
            console.log(`** Worker "${this.name}" fully initialized and ready **`)
            if (cb) cb(null)
            resolve()
            return
          }

          // For non-HTTP workers or fallback if server not ready yet
          if (this.worker.active) {
            console.log(`** Worker "${this.name}" is active and ready **`)
            if (cb) cb(null)
            resolve()
            return
          }

          // Not ready yet, check again in 100ms
          setTimeout(checkReady, 100)
        }

        // Start checking if worker is ready
        checkReady()
      } catch (err) {
        if (cb) cb(err)
        reject(err)
      }
    })
  }

  async stop (cb = () => {}) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        console.log(`** Worker "${this.name}" was not started, nothing to stop **`)
        if (cb) cb(null)
        return resolve()
      }

      try {
        // Only call stop if we have a worker instance
        this.worker.stop((err) => {
          if (err) {
            if (cb) cb(err)
            return reject(err)
          }
          console.log(`** Worker "${this.name}" stopped successfully **`)
          if (cb) cb(null)
          resolve()
        })
      } catch (err) {
        console.log(`** Error stopping worker: ${err.message} **`)
        if (cb) cb(err)
        reject(err)
      }
    })
  }
}

function createWorker (conf) {
  // Construct the context object
  const ctx = {
    env: conf.env || 'development',
    wtype: conf.wtype,
    root: conf.serviceRoot,
    port: conf.port
  }

  return new Worker(conf, ctx)
}

module.exports = {
  Worker,
  createWorker
}
