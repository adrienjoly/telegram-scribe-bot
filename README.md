# `telegram-scribe-bot`

A (work-in-progress) chat-bot that can add comments to Trello cards, from any Telegram client.

Note: the first version of this bot was developed by following the steps provided in [Serverless Telegram Bot with Firebase - Francisco Gutiérrez - Medium](https://medium.com/@pikilon/serverless-telegram-bot-with-firebase-d11d07579d8a).

## Setup

Follow these steps to setup your own "scribe" bot, connect it to your own Trello board and deploy it to your own Firebase account.

1. Clone the project
  - `$ git clone https://github.com/adrienjoly/telegram-scribe-bot.git`
  - `$ cd telegram-scribe-bot`
  - `$ cd functions`
  - `$ npm install` (to install the Node.js dependencies)
  - `$ cp .env.example .env` (we will set your Firebase, Telegram and Trello credentials in this confidential file, in later steps)

2. Create a Firebase project (still from the `functions` sub-folder)
  - Go to [your firebase console](https://console.firebase.google.com)
  - Add a new project
  - In the `.firebaserc` file, replace `telegram-scribe-bot` by the id of that project
  - `$ npm run deploy:setup` (to login to your Firebase account)

3. Create a Telegram bot
  - In your Telegram app, start a conversation with [@BotFather](https://telegram.me/BotFather)
  - Write the command `/newBot` and follow the provided steps
  - In the `.env` file, replace the default `BOT_TOKEN` value by the Secret Token provided by that bot
  - Also, take note of the name of your bot (ends with `bot`), we'll need it later

4. Deploy and bind the bot to Telegram (still from the `functions` sub-folder)
  - `$ npm run deploy` (will upload the source code to your Firebase project)
  - In the `.env` file, replace the default `ROUTER_URL` value by the one printed when deploying (previous step), it must end with `/router/`
  - `$ npm run deploy:test` (to check that the function deployed on Firebase works as expected)
  - `$ npm run webhook:bind` (to bind that function to your Telegram bot)
  - `$ npm run webhook:test` (to check that the function's router URL was properly bound to your Telegram bot)

5. Test your bot
  - In your Telegram app, start a conversation with your bot (e.g. mine is [@aj_scribe_bot](t.me/aj_scribe_bot))
  - Send "hello"
  - The bot should reply with your name

After making any change to your bot, don't forget to deploy again it using `$ npm run deploy`.

You can troubleshoot your bot using [your firebase console](https://console.firebase.google.com).

You can also run and test the bot/webhook locally using `$ npm start` or `$ npm run serve`, but it would be much more complicated to bind it to Telegram's API.

## ToDo / Next steps

- Actually connect the bot to a Trello board
- Send required env vars to Firebase using [`firebase functions:config:set`](https://firebase.google.com/docs/cli/#project_aliases)
- Make setup easier and faster, e.g. by automatizing some of the steps
- Provide tests that can work locally
