# `telegram-scribe-bot`

A (work-in-progress) chat-bot that can add comments to Trello cards, your TickTick todo-list and your Diigo bookmarks, from any Telegram client.

**Is this yet another chatbot or virtual assistant supposedly supported by AI?** No. It's actually pretty dumb. Think of it more like a terminal, or like MacOS' Spotlight feature: it uses Telegram as a way to save text to other services, through their API. That's it.

**Why rely on Telegram?** Sending data from a mobile terminal to a server is far from trivial. For instance, your internet connection may be unstable (or unexistent) at the time when you want to save something. In that case, you'd expect your message to be automatically re-sent as soon as your internet connectivity is back. Telegram provides that out of the box! ✨

**Supported commands**

- `/todo <task> [#tag [#...]]` will add a ToDo/task to TickTick's inbox, for sorting
- `/today <task> [#tag [#...]]` will add a ToDo/task to TickTick, due today
- `/note <text> [#card [#...]]` will add a comment to the specified Trello card(s), for journaling

Note: the first version of this bot was developed by following the steps provided in [Serverless Telegram Bot with Firebase - Francisco Gutiérrez - Medium](https://medium.com/@pikilon/serverless-telegram-bot-with-firebase-d11d07579d8a).

## Clone and Install

To get started, you just need `git`, NodeJS and to follow these instructions:

```sh
$ git clone https://github.com/adrienjoly/telegram-scribe-bot.git
$ cd telegram-scribe-bot
$ cd functions
$ npm install
$ npm run build
```

## Test locally (optional)

Before binding the chat-bot to Telegram, you can test it locally:

```sh
$ npm start

# ... then, in a separate terminal:
$ npm test
```

## Setup

Follow these steps to setup your own "scribe" bot, connect it to your own Trello board and deploy it to your own Firebase account.

### 1. Clone the project

- See the [Clone and Install](#clone-and-install) section above

### 2. Create a Firebase project

- Go to [your firebase console](https://console.firebase.google.com)
- Add a new project
- In the `.firebaserc` file, replace `telegram-scribe-bot` by the id of that project
- `$ npm run deploy:setup` (to login to your Firebase account)
- `$ cp .env.example .env` (we will set your Firebase, Telegram and Trello credentials in this confidential file, in later steps)

### 3. Create a Telegram bot

- In your Telegram app, start a conversation with [@BotFather](https://telegram.me/BotFather)
- Write the command `/newBot` and follow the provided steps
- In the `.env` file, replace the default `BOT_TOKEN` value by the Secret Token provided by that bot
- Also, take note of the name of your bot (ends with `bot`), we'll need it later

### 4. Deploy and bind the bot to Telegram

- `$ npm run deploy` (will upload the source code to your Firebase project)
- In the `.env` file, replace the default `ROUTER_URL` value by the one printed when deploying (previous step), it must end with `/router/`
- `$ npm run deploy:test` (to check that the function deployed on Firebase works as expected)
- `$ npm run webhook:bind` (to bind that function to your Telegram bot)
- `$ npm run webhook:test` (to check that the function's router URL was properly bound to your Telegram bot)

### 5. Test your bot

- In your Telegram app, start a conversation with your bot (e.g. mine is [@aj_scribe_bot](t.me/aj_scribe_bot))
- Send "hello"
- The bot should reply with your name

### 6. Bind to a Trello board

- Copy your Trello API Key (from [trello.com/app-key](https://trello.com/app-key)) and paste it as the value of the `TRELLO_API_KEY` variable, in your `.env` file
- Manually generate a Token (a link is provided on [trello.com/app-key](https://trello.com/app-key), below the Trello API Key) and paste it as the value of the `TRELLO_USER_TOKEN` variable, still in your `.env` file
- Run `$ npm run trello:test` to make sure that these credentials give access to Trello's API
- Run `$ npm run trello:boards` to display the list of the Trello boards you have access to
- Copy the 24-characters-long identifier of the Trello board that you want your bot to edit, and paste it as the value of the `TRELLO_BOARD_ID` variable of your `.env` file
- Run `$ npm run deploy:config` to upload your environment variables to the cloud function

After making any change to your bot, don't forget to deploy again it using `$ npm run deploy`.

In order to bind `#tags` to some of your Trello cards, specify them as below, anywhere in the comment of those cards:

```
telegram-scribe-bot:addCommentsFromTaggedNotes(#tag1,#tag2,...)
```

For instance, if you have a card in which you want to store your `#diary` notes as comments, add the following line to the description of that card:

```
telegram-scribe-bot:addCommentsFromTaggedNotes(#diary)
```

After doing that, the following chat message will add a comment to that card:

> /note #diary I had a great day today!

You can troubleshoot your bot using [your firebase console](https://console.firebase.google.com).

You can also run and test the bot/webhook locally using `$ npm start` or `$ npm run serve`, but it would be much more complicated to bind it to Telegram's API.

## Options

Set `TELEGRAM_USER_ID` in your `.env` file and call `$ npm run deploy:config` again if you want the bot to only respond to that Telegram user identifier.

## ToDo / Next steps

- Make setup easier and faster, e.g. by automatizing some of the steps
- ideas of "command" use cases to implement:
  - `/search <text> [#tag [#...]]` will search occurrences of `text` in comments of Trello cards, optionally filtered by `#tags`
  - `/openwhyd <track> [#tag] [desc]` will add a music track (e.g. YouTube URL) to Openwhyd.org, in a playlist corresponding to the `tag`, and may add a `desc`ription if provided
  - `/next <task> [#tag]` will add a `task` to the top of the check-list of the Trello card associated with `#tag`
  - `/issue <repo>` will create a github issue on the provided repo
  - `/bk <url> [desc] [#tag]>` will create a Diigo bookmark to that URL
  - `/met "<person name>" [@place] [#tag] [desc]` will create or update a Google Contact
  - `/convert` units of measure into others (e.g. timezones, sizes, currencies, data formats...)
- ideas of "request" use cases to implement:
  - when waking up: invite to keep a note of the dream you were having
  - before going to sleep: invite to keep a note of how was your day (i.e. mood) and of what you did that day (i.e. journal), possibly with a photo to illustrate it
- read [issues](https://github.com/adrienjoly/telegram-scribe-bot/issues) for more.
