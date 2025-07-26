'use strict'

const path = require('path')
const { createWorker } = require('../lib/worker')
const createClient = require('../lib/client')

;(async () => {
  try {
    // Step 1: Create and start the worker
    const workerConfig = {
      env: 'development',
      wtype: 'wrk-node-http',
      port: 3000,
      serviceRoot: path.join(__dirname, '..', '..', 'rumble-app-node')
    }

    const worker = createWorker(workerConfig)
    await worker.start()

    // Step 2: Create and connect a client
    const client = createClient(worker)
    await client.connect()

    // Step 3: Make an RPC call to the worker
    const method = 'ping' // Use a method that the worker actually implements
    const payload = { message: 'Hello, Tether!' }

    console.log(`Sending RPC request to "${worker.name}" with method "${method}"...\n`)
    const response = await client.request(method, payload)
    console.log('Response from Tether service:', response)

    // Step 4: Clean up in the proper order
    await client.disconnect()
    await worker.stop()
    console.log('== Example completed successfully ==')
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
})()
