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
  location: TelegramLocation
}
