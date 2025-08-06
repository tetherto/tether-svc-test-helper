'use strict'

const worker = require('bfx-svc-boot-js/lib/worker')

class Worker {
  constructor (conf, ctx) {
    this.conf = conf
    this.ctx = ctx
    this.name = ctx.wtype
    this.worker = null
    this.delay = conf.delay || 10000 // Default to 10 seconds
  }

  async start (cb = () => { }) {
    return new Promise((resolve, reject) => {
      try {
        this.worker = worker(this.conf)
        if (!this.worker) {
          const err = new Error('Worker instance could not be created')
          if (cb) cb(err)
          return reject(err)
        }
        // Set a timeout to prvent indefinite hanging if the worker does not start
        const timeout = setTimeout(() => {
          const err = new Error(`Worker "${this.name}" did not start within ${this.delay}ms`)
          if (cb) cb(err)
          reject(err)
        }, this.delay)

        this.worker.once('started', () => {
          clearTimeout(timeout)
          if (cb) cb(null)
          resolve()
        })
      } catch (err) {
        if (cb) cb(err)
        reject(err)
      }
    })
  }

  async stop (cb = () => { }) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
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
          if (cb) cb(null)
          resolve()
        })
      } catch (err) {
        if (cb) cb(err)
        reject(err)
      }
    })
  }
}

function createWorker (conf) {
  // Construct the context object
  const ctx = {
    env: conf.env || 'test',
    wtype: conf.wtype,
    root: conf.serviceRoot,
    ...conf
  }

  return new Worker(conf, ctx)
}

module.exports = {
  Worker,
  createWorker
}
