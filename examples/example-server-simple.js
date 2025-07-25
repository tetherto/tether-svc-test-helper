'use strict'

const createServer = require('../lib/server')
const fetch = require('node-fetch')

// Define simple routes using reply and route
const server = createServer([
  {
    route: '/api/v1/device-ids',
    reply: { message: 'Device ID stored successfully' }
  },
  {
    route: '/api/v1/device-ids/list',
    reply: { deviceIds: ['device1', 'device2'] }
  },
  {
    route: '/api/v1/device-ids/delete',
    reply: { message: 'Device ID deleted successfully' }
  }
], { port: 1337, debug: true })

;(async () => {
  await server.start()
  console.log('** Mock server started on port 1337')

  const res = await fetch('http://localhost:1337/api/v1/device-ids', {
    body: JSON.stringify({ deviceId: 'device1' }),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })

  console.log('Response:', await res.json(), 'Status:', res.status)

  await server.stop()
  console.log('** Mock server stopped')
})()
