import { MessageHandlerOptions, BotResponse } from './../types'
import { ParsedMessageEntities } from './../Telegram'
import { Ticktick } from './../Ticktick'

export const addTaskToTicktick = async (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
): Promise<BotResponse> => {
  if (!options.ticktick.email) throw new Error('missing ticktick.email')
  if (!options.ticktick.password) throw new Error('missing ticktick.password')
  const ticktick = new Ticktick(
    options.ticktick.email,
    options.ticktick.password
  )
  await ticktick.connect()
  const desc = `Sent from Telegram-scribe-bot, on ${message.date}`
  // note: user's location can be requested, cf https://tutorials.botsfloor.com/request-and-handle-phone-number-and-location-with-telegram-bot-api-e90004c0c87e
  await ticktick.addTask(message.rest, desc)
  return { text: "✅  Sent to Ticktick's inbox" }
}

export const addTodayTaskToTicktick = async (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
): Promise<BotResponse> => {
  if (!options.ticktick?.email) throw new Error('missing ticktick.email')
  if (!options.ticktick?.password) throw new Error('missing ticktick.password')
  const ticktick = new Ticktick(
    options.ticktick.email,
    options.ticktick.password
  )
  await ticktick.connect()
  const desc = `Sent from Telegram-scribe-bot, on ${message.date}`
  await ticktick.addTask(message.rest, desc, new Date(), true)
  return { text: '✅  Sent to Ticktick\'s "Today" tasks' }
}
