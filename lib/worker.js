'use strict'

class Worker {
  constructor (conf, ctx) {
    this.conf = conf
    this.ctx = ctx
    this.worker = null
  }

  async start () {
    if (!this.conf) {
      throw new Error('ERR_WORKER_MISSING_CONFIG')
    }

    if (!this.ctx) {
      throw new Error('ERR_WORKER_MISSING_CONTEXT')
    }

    this.worker = new this.ctx.Worker(this.conf, this.ctx)
    await this.worker.start()
    return this.worker
  }

  async stop () {
    if (!this.worker) {
      throw new Error('ERR_WORKER_NOT_INITIALIZED')
    }

    await this.worker.stop()
    this.worker = null
  }
}

function createWorker (conf, ctx) {
  return new Worker(conf, ctx)
}

module.exports = {
  Worker,
  createWorker
}
