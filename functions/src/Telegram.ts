// reference: https://core.telegram.org/bots/api#available-types

export type TelegramChat = {
  id: Number
}

export type TelegramUser = {
  id: Number
  first_name: String
}

export type TelegramLocation = {
  longitude: number
  latitude: number
}

export type MessageEntity = {
  type: string // can be mention (@username), hashtag, cashtag, bot_command, url, email, phone_number, bold (bold text), italic (italic text), code (monowidth string), pre (monowidth block), text_link (for clickable text URLs), text_mention (for users without usernames)
  offset: number // Integer	Offset in UTF-16 code units to the start of the entity
  length: number // Integer	Length of the entity in UTF-16 code units
  url: string // (Optional) For “text_link” only, url that will be opened after user taps on the text
  user: TelegramUser // (Optional) For “text_mention” only, the mentioned user
}

export type TelegramMessage = {
  chat: TelegramChat
  from: TelegramUser
  text: string
  date: number // Date the message was sent in Unix time
  location: TelegramLocation // if the user has explicitely shared their location
  entities: MessageEntity[]
}

export function parseMessage(container: any) {
  try {
    return container.message.chat && container.message.from
      ? container.message
      : null
  } catch (err) {
    throw new Error('not a telegram message')
  }
}

type MessageEntityWithText = MessageEntity & {
  text: string
}

export type ParsedMessageEntities = {
  date: Date
  commands: MessageEntityWithText[]
  tags: MessageEntityWithText[]
  rest: string
}

export function parseEntities(
  message: TelegramMessage,
  supportedTypes = ['bot_command', 'hashtag'],
  inlineTypes = ['hashtag'] // types of entities to leave in the `rest` return value
): ParsedMessageEntities {
  const entities: MessageEntity[] = message.entities || []
  const supportedEntities = entities.filter(({ type }) =>
    supportedTypes.includes(type)
  )
  // add a `text` property in each supported entity
  const entitiesWithText = supportedEntities.map(entity => ({
    ...entity,
    text: message.text.substr(entity.offset, entity.length),
  }))
  // remove parsed entities from the message's text => return the rest
  const rest = supportedEntities
    .filter(({ type }) => !inlineTypes.includes(type)) // do not remove inlineTypes entities
    .sort((a, b) => b.offset - a.offset) // we'll remove from the end to the beginning of the string, to keep the offsets valid
    .reduce((text, entity) => {
      return (
        text.substr(0, entity.offset) +
        text.substr(entity.offset + entity.length)
      )
    }, message.text)
    .replace(/  +/, ' ') // remove duplicate spaces
  return {
    date: new Date(message.date * 1000),
    commands: entitiesWithText.filter(({ type }) => type === 'bot_command'),
    tags: entitiesWithText.filter(({ type }) => type === 'hashtag'),
    rest,
  }
}
