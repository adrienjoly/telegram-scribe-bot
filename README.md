# `telegram-scribe-bot`

A (work-in-progress) chat-bot that can add comments to Trello cards, your TickTick todo-list and your Diigo bookmarks, from any Telegram client.

**Is this yet another chatbot or virtual assistant supposedly supported by AI?** No. It's actually pretty dumb. Think of it more like a terminal, or like MacOS' Spotlight feature: it uses Telegram as a way to save text to other services, through their API. That's it.

**Why rely on Telegram?** Sending data from a mobile terminal to a server is far from trivial. For instance, your internet connection may be unstable (or unexistent) at the time when you want to save something. In that case, you'd expect your message to be automatically re-sent as soon as your internet connectivity is back. Telegram provides that out of the box! ✨

**Supported commands**

- `/todo <task> [#tag [#...]]` will add a ToDo/task to TickTick's inbox, for sorting
- `/today <task> [#tag [#...]]` will add a ToDo/task to TickTick, due today
- `/next <task> [#tag]` will add a `task` to the top of the check-list of the Trello card associated with `#tag`
- `/note <text> [#card [#...]]` will add a comment to the specified Trello card(s), for journaling

Note: the first version of this bot was developed by following the steps provided in [Serverless Telegram Bot with Firebase - Francisco Gutiérrez - Medium](https://medium.com/@pikilon/serverless-telegram-bot-with-firebase-d11d07579d8a).

## Clone and Install

To get started, you just need `git`, NodeJS and to follow these instructions:

```sh
$ git clone https://github.com/adrienjoly/telegram-scribe-bot.git
$ cd telegram-scribe-bot
$ cd functions
$ npm install
$ npm test # run automated test suites
```

## Local setup and testing

Before making your chat-bot accessible through Telegram, you can test it locally:

```sh
$ npm run test:bot
```

This command will start a CLI that will allow you to interact with the bot without having to put it online.

Let's see how to set it up.

### 1. Connect to a Trello board

Trello credentials must be provided in a `.config.json` file, at the root directory of the project.

1. Get started by copying the provided template: `$ cp .config.example.json .config.json`
2. Copy your Trello API Key (from [trello.com/app-key](https://trello.com/app-key)) and paste it as the value of the `trello.apikey` variable, in your `.config.json` file
3. Manually generate a Token (a link is provided on [trello.com/app-key](https://trello.com/app-key), below the Trello API Key) and paste it as the value of the `trello.usertoken` variable, still in your `.config.json` file
4. Run `$ npm run trello:test` to make sure that these credentials give access to Trello's API
5. Run `$ npm run trello:boards` to display the list of the Trello boards you have access to
6. Copy the 24-characters-long identifier of the Trello board that you want your bot to edit, and paste it as the value of the `trello.boardid` variable of your `.config.json` file

If you want to also connect to your TickTick account, fill the `ticktick.email` and `ticktick.password` variables accordingly.

### 2. Bind tags to Trello cards

In order to add comments and tasks to your Trello cards, you must associate one or more hashtags to these cards.

How to achieve this?

1. Open one of your Trello cards
2. In the description of that card, add the following text: `telegram-scribe-bot:addCommentsFromTaggedNotes(#mytag1,mytag2,...)`, and save your changes
3. After doing so, you'll be able to add a comment to that card, by sending the following message through your Telegram app: `/note hello world! #mytag1`

For instance, if you have a card in which you want to store your `#diary` notes as comments, add the following line to the description of that card:

```
telegram-scribe-bot:addCommentsFromTaggedNotes(#diary)
```

After doing that, the following chat message will add a comment to that card:

> /note I had a great day today! #diary

## Production Setup

Follow these steps to deploy your bot to Firebase and make it accessible through Telegram.

### 1. Create a Firebase project

- Go to [your firebase console](https://console.firebase.google.com)
- Add a new project
- In the `.firebaserc` file, replace `telegram-scribe-bot` by the id of that project
- `$ npm run deploy:setup` (to login to your Firebase account)

### 2. Create a Telegram bot

- In your Telegram app, start a conversation with [@BotFather](https://telegram.me/BotFather)
- Write the command `/newBot` and follow the provided steps
- Initialize the `.env` file, based on the provided template: `$ cp .env.example .env`
- In the `.env` file, replace the default `BOT_TOKEN` value by the Secret Token provided by that bot
- Also, take note of the name of your bot (ends with `bot`), we'll need it later

### 3. Deploy and bind the bot to Telegram

- `$ npm run deploy` (will upload the source code to your Firebase project)
- In the `.env` file, replace the default `ROUTER_URL` value by the one printed when deploying (previous step), it must end with `/router/`
- `$ npm run deploy:test` (to check that the function deployed on Firebase works as expected)
- `$ npm run webhook:bind` (to bind that function to your Telegram bot)
- `$ npm run webhook:test` (to check that the function's router URL was properly bound to your Telegram bot)
- `$ npm run deploy:config` to upload your configuration (from `.config.json`) to the cloud function

After making any change to your bot, don't forget to deploy again it using `$ npm run deploy`.

### 4. Test your bot

- In your Telegram app, start a conversation with your bot (e.g. mine is [@aj_scribe_bot](t.me/aj_scribe_bot))
- Send "hello"
- The bot should reply with your name

You can troubleshoot your bot using [your firebase console](https://console.firebase.google.com).

### Options

Set `telegram.onlyfromuserid` in your `.config.json` file and call `$ npm run deploy:config` again if you want the bot to only respond to that Telegram user identifier.

## ToDo / Next steps

- Make setup easier and faster, e.g. by automatizing some of the steps
- ideas of "command" use cases to implement:
  - `/search <text> [#tag [#...]]` will search occurrences of `text` in comments of Trello cards, optionally filtered by `#tags`
  - `/openwhyd <track> [#tag] [desc]` will add a music track (e.g. YouTube URL) to Openwhyd.org, in a playlist corresponding to the `tag`, and may add a `desc`ription if provided
  - `/issue <repo>` will create a github issue on the provided repo
  - `/bk <url> [desc] [#tag]>` will create a Diigo bookmark to that URL
  - `/met "<person name>" [@place] [#tag] [desc]` will create or update a Google Contact
  - `/convert` units of measure into others (e.g. timezones, sizes, currencies, data formats...)
- ideas of "request" use cases to implement:
  - when waking up: invite to keep a note of the dream you were having
  - before going to sleep: invite to keep a note of how was your day (i.e. mood) and of what you did that day (i.e. journal), possibly with a photo to illustrate it
- read [issues](https://github.com/adrienjoly/telegram-scribe-bot/issues) for more.
