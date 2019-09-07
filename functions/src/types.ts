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

export type TelegramMessage = {
  chat: TelegramChat
  from: TelegramUser
  text: string
  date: number // Date the message was sent in Unix time
  location: TelegramLocation // if the user has explicitely shared their location
}
