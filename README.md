# tether-svc-test-helper

A library for testing Tether workers.

## Features

- Start and stop Tether worker instances programmatically
- Connect to workers and perform RPC requests
- Automatically detects worker readiness and handles RPC key changes
- Includes retry logic for robust RPC communication

## Usage

```js
const { createWorker } = require('./lib/worker')
const createClient = require('./lib/client')

const worker = createWorker({ ...config })
await worker.start()

const client = createClient(worker)
await client.connect()

const response = await client.request('ping', { message: 'Hello, Tether!' })
console.log(response)

await client.stop()
await worker.stop()
```

See `examples/example.js` for a complete usage example.