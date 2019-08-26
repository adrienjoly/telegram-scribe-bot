export type TelegramChat = {
  id: Number
}

export type TelegramUser = {
  id: Number
  first_name: String
}

export type TelegramMessage = {
  chat: TelegramChat
  from: TelegramUser
}
