/// <reference types="mocha" />

require('dotenv').config({ path: `${__dirname}/../../.env` }) // load environment variables
import * as expect from 'expect'
import fetch from 'node-fetch'
import { startApp } from './../lib/src/app'

const options = {
  trelloApiKey: process.env.TRELLO_API_KEY,
  trelloUserToken: process.env.TRELLO_USER_TOKEN,
}

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
    const server = await startApp({ port, options })
    const res = await fetch(`http://localhost:${port}/`)
    expect(res.status).toEqual(200)
    expect(await res.json()).toHaveProperty('ok', true)
    server.destroy()
  })

  it('responds 400 to invalid telegram message', async () => {
    const port = allocatePort()
    const server = await startApp({ port, options })
    const res = await postJSON(`http://localhost:${port}/`, {})
    expect(res.status).toEqual(400)
    expect(await res.json()).toHaveProperty('status', 'not a telegram message')
    server.destroy()
  })

  it('responds to valid telegram message', async () => {
    const port = allocatePort()
    const server = await startApp({ port, options })
    const message = {
      chat: { id: 1 },
      from: { first_name: 'test_name' },
      text: 'Hello world!',
    }
    const res = await postJSON(`http://localhost:${port}/`, { message })
    const payload = await res.json()
    expect(payload.status).toBeUndefined()
    expect(res.status).toEqual(200)
    expect(payload.text).toMatch(/Please retry with a valid command/)
    server.destroy()
  })

  it('responds 403 to telegram message from other user', async () => {
    const port = allocatePort()
    const onlyFromUserId = 1
    const message = {
      chat: { id: 1 },
      from: {
        id: onlyFromUserId + 1, // this message is not sent by the expected user
        first_name: 'test_name',
      },
    }
    const server = await startApp({
      port,
      options: { ...options, onlyFromUserId },
    })
    const res = await postJSON(`http://localhost:${port}/`, { message })
    expect(res.status).toEqual(403)
    expect(await res.json()).toHaveProperty(
      'status',
      'this sender is not allowed'
    )
    server.destroy()
  })
  /*
  it('responds with error if failing to connect to trello', async () => {
    const port = allocatePort()
    const message = {
      chat: { id: 1 },
      from: { first_name: 'test_name' },
    }
    const server = await startApp({
      port,
      options: { ...options, trelloApiKey: 'incorrect' },
    })
    const res = await postJSON(`http://localhost:${port}/`, { message })
    expect(res.status).toEqual(200)
    const payload = await res.json()
    expect(payload.text).toMatch('invalid key')
    server.destroy()
  })
  */
})