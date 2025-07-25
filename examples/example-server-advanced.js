'use strict'

const createServer = require('../lib/server')
const fetch = require('node-fetch')
const assert = require('assert')

// Define advanced routes using match
const server = createServer({
  // Define the reply logic for matched routes
  reply: (reply) => {
    // Send a success message with HTTP status 200
    reply({ message: 'Device ID deleted successfully' }, 200)
  },

  // Define the matching logic for incoming requests
  match: (payload, match) => {
    match({
      method: 'DELETE',
      custom: (req, res, cb) => {
        const urlPattern = /^\/api\/v1\/device-ids\/([^/]+)$/
        const match = req.url.match(urlPattern)

        if (match) {
          const deviceId = match[1] // Extract the deviceId from the URL
          // Validate the deviceId (only 'device1' is valid)
          cb(null, deviceId === 'device1')
        } else {
          // No match for the URL pattern
          cb(null, false)
        }
      }
    })
  },

  // Define additional tests for the request payload
  test: (req, res, payload, cb) => {
    // Ensure the payload contains the 'deviceId' property
    assert.ok(payload.deviceId, 'missing deviceId property')
    cb(null)
  }
}, { port: 1338 }) // Use a different port to avoid conflicts with other scripts

;(async () => {
  await server.start()
  console.log('** Mock server started on port 1338') // Useful for confirming the server is running

  // Send a DELETE request to the mock server
  const res = await fetch('http://localhost:1338/api/v1/device-ids/device1', {
    body: JSON.stringify({ deviceId: 'device1' }), // Include the deviceId in the payload
    method: 'DELETE', // Use the DELETE method
    headers: { 'Content-Type': 'application/json' } // Set the content type to JSON
  })

  // Log the response from the server
  console.log('Response:', await res.json(), 'Status:', res.status) // Useful for debugging and verifying the response

  await server.stop()
  console.log('** Mock server stopped') // Useful for confirming the server has stopped
})()
