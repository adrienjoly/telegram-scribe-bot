import { MessageHandlerOptions } from './../types'
import { ParsedMessageEntities } from './../Telegram'
import { Ticktick } from './../Ticktick'

export const addTaskToTicktick = async (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
) => {
  if (!options.ticktickEmail) throw new Error('missing ticktickEmail')
  if (!options.ticktickPassword) throw new Error('missing ticktickPassword')
  const ticktick = new Ticktick(options.ticktickEmail, options.ticktickPassword)
  await ticktick.connect()
  const desc = `Sent from Telegram-scribe-bot, on ${new Date(
    message.initial.date * 1000
  )}`
  // note: user's location can be requested, cf https://tutorials.botsfloor.com/request-and-handle-phone-number-and-location-with-telegram-bot-api-e90004c0c87e
  await ticktick.addTask(message.rest, desc)
  return { text: "✅  Sent to Ticktick's inbox" }
}

export const addTodayTaskToTicktick = async (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
) => {
  if (!options.ticktickEmail) throw new Error('missing ticktickEmail')
  if (!options.ticktickPassword) throw new Error('missing ticktickPassword')
  const ticktick = new Ticktick(options.ticktickEmail, options.ticktickPassword)
  await ticktick.connect()
  const desc = `Sent from Telegram-scribe-bot, on ${new Date(
    message.initial.date * 1000
  )}`
  await ticktick.addTask(message.rest, desc, new Date(), true)
  return { text: '✅  Sent to Ticktick\'s "Today" tasks' }
}
