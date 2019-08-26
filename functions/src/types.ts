export type TelegramChat = {
  id: Number
}

export type TelegramUser = {
  first_name: String
}

export type TelegramMessage = {
  chat: TelegramChat
  from: TelegramUser
}
