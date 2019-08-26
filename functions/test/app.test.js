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

  it('responds to valid telegram message', async () => {
    const port = allocatePort()
    const server = await startApp({ port })
    const message = {
      chat: { id: 1 },
      from: { first_name: 'test_name' },
    }
    const res = await fetch(`http://localhost:${port}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    assert.equal(res.status, 200)
    assert.equal(await res.text(), '{"method":"sendMessage","chat_id":1,"text":"Hello test_name"}')
    server.destroy()
  })
})
