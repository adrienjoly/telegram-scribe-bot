const assert = require('assert')
const fetch = require('node-fetch')

const { startApp } = require('./../lib/app')

const allocatePort = (() => {
  let current = 8081
  return () => current++
})()

describe('app', () => {
  it('responds to GET /', async () => {
    const port = allocatePort()
    const server = await startApp({ port })
    const res = await fetch(`http://localhost:${port}/`)
    assert.equal(res.status, 200)
    assert.equal(await res.text(), '{"ok":true}')
    server.destroy()
  })

  it('responds 400 to invalid telegram message', async () => {
    const port = allocatePort()
    const server = await startApp({ port })
    const res = await fetch(`http://localhost:${port}/`, { method: 'POST', body: '' })
    assert.equal(res.status, 400)
    assert.equal(await res.text(), '{"status":"not a telegram message"}')
    server.destroy()
  })
})
