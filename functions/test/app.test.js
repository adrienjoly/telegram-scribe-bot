const expect = require('expect')
const fetch = require('node-fetch')

const { startApp } = require('./../lib/app')

require('dotenv').config({ path: '../.env' }) // load environment variables

const { TELEGRAM_USER_ID } = process.env
const telegramSenderId = TELEGRAM_USER_ID ? parseInt(TELEGRAM_USER_ID, 10) : 0

const allocatePort = (() => {
  let current = 8081
  return () => current++
})()

const postJSON = (url, json) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json),
  })

describe('app', () => {
  it('responds to GET /', async () => {
    const port = allocatePort()
    const server = await startApp({ port })
    const res = await fetch(`http://localhost:${port}/`)
    expect(res.status).toEqual(200)
    expect(await res.json()).toHaveProperty('ok', true)
    server.destroy()
  })

  it('responds 400 to invalid telegram message', async () => {
    const port = allocatePort()
    const server = await startApp({ port })
    const res = await postJSON(`http://localhost:${port}/`, {})
    expect(res.status).toEqual(400)
    expect(await res.json()).toHaveProperty('status', 'not a telegram message')
    server.destroy()
  })

  it('responds to valid telegram message', async () => {
    const port = allocatePort()
    const server = await startApp({ port })
    const message = {
      chat: { id: 1 },
      from: {
        id: telegramSenderId,
        first_name: 'test_name',
      },
    }
    const res = await postJSON(`http://localhost:${port}/`, { message })
    expect(res.status).toEqual(200)
    expect(await res.json()).toHaveProperty('text', 'Hello test_name')
    server.destroy()
  })

  it('responds 403 to telegram message from other user', async () => {
    const port = allocatePort()
    const message = {
      chat: { id: 1 },
      from: {
        id: telegramSenderId + 1,
        first_name: 'test_name',
      },
    }
    const server = await startApp({ port })
    const res = await postJSON(`http://localhost:${port}/`, { message })
    expect(res.status).toEqual(403)
    expect(await res.json()).toHaveProperty(
      'status',
      'this sender is not allowed'
    )
    server.destroy()
  })
})
