# `telegram-scribe-bot`

A chat-bot for Telegram that can add comments to Trello cards, your TickTick todo-list and your Diigo bookmarks, from any Telegram client. (see list of supported commands, below)

This chat-bot consists of a webhook served by Express.js and designed to run on Firebase Functions. It uses Telegram's [`setWebhook` function](https://core.telegram.org/bots/api#setwebhook).

The first version of this bot was developed by following the steps provided in [Serverless Telegram Bot with Firebase - Francisco Gutiérrez - Medium](https://medium.com/@pikilon/serverless-telegram-bot-with-firebase-d11d07579d8a).

## Supported commands

### Openwhyd commands

- `/openwhyd <youtube_video_url> [description]` post a YouTube video on Openwhyd.org

### TickTick commands

- `/todo <task> [#tag [#...]]` adds a ToDo/task to TickTick's inbox, for sorting
- `/today <task> [#tag [#...]]` adds a ToDo/task to TickTick, due today

### Trello commands

- `/tags` lists the tags associated to each Trello card
- `/next` lists the next `task` for each Trello card
- `/next <task> [#tag]` adds a `task` to the top of the check-list of the Trello card associated with `#tag`
- `/note <text> [#card [#...]]` adds a comment to the specified Trello card(s), for journaling

### GitHub commands

- `/shelf <spotify_album_url>` proposes the addition of an album to the [adrienjoly/album-shelf](https://github.com/adrienjoly/album-shelf) GitHub repository (requires options: `spotify.clientid`, `spotify.secret` and `github.token` with "public repo" permissions)

### Other commands

- `/version` returns the version of the Bot

Notes:

- You can find an up-to-date list of commands in the `commandHandlers` constant defined in [`src/messageHandler.ts`](https://github.com/adrienjoly/telegram-scribe-bot/blob/master/functions/src/messageHandler.ts);
- You can find commands that I plan to add later in the [ToDo / Next steps](#todo--next-steps) section of this page.

## Clone and Install

To get started, you just need `git`, NodeJS and to follow these instructions:

```sh
$ git clone https://github.com/adrienjoly/telegram-scribe-bot.git
$ cd telegram-scribe-bot
$ nvm use # to use the project's expected Node.js version
$ make install
$ make test # run automated test suites
```

## Local setup and testing

Before making your chat-bot accessible through Telegram, you can test it locally:

```sh
$ make test-bot
```

This command will start a CLI that will allow you to interact with the bot (e.g. to test the connection with Trello and other services) without having to put it online.

Let's see how to set it up.

### 0. Create the configuration file

Credentials of your services must be provided in a `.env` file, in the `functions` directory of the project.

Initialize it based on the provided template: `$ cp functions/.env.example functions/.env`

### 1. Connect to a Trello board

Trello credentials must be provided in your `.env` file.

1. Copy your Trello API Key (from [trello.com/app-key](https://trello.com/app-key)) and paste it as the value of the `TRELLO_API_KEY` variable, in your `functions/.env` file
2. Manually generate a Token (a link is provided on [trello.com/app-key](https://trello.com/app-key), below the Trello API Key) and paste it as the value of the `TRELLO_USER_TOKEN` variable, still in your `functions/.env` file
3. Run `$ tools/trello-boards.ts` to make sure that these credentials give access to Trello's API and display the list of the Trello boards you have access to
4. Copy the 24-characters-long identifier of the Trello board that you want your bot to edit, and paste it as the value of the `TRELLO_BOARD_ID` variable of your `functions/.env` file

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

After doing that, sending the following chat message should add a comment to that card:

> /note I had a great day today! #diary

### 3. Provide credentials for other services

Complete your `functions/.env` file by providing the credentials of the services you want the bot to interact with:

- Your Telegram user ID can be retrieved by sending `/start` to https://web.telegram.org/k/#@userinfobot (set as `TELEGRAM_ONLY_FROM_USER_ID` in `functions/.env`)
- Spotify credentials can be generated from https://developer.spotify.com/dashboard/applications (set as `SPOTIFY_CLIENT_ID` and `SPOTIFY_SECRET` in `functions/.env`)
- GitHub token (with `public_repo` scope) can be generated from https://github.com/settings/tokens (set as `GITHUB_TOKEN` in `functions/.env`)

## Production Setup

Follow these steps to deploy your bot to Firebase and make it accessible through Telegram.

### 1. Create a Telegram bot

- In your Telegram app, start a conversation with [@BotFather](https://telegram.me/BotFather)
- Write the command `/newBot` and follow the provided steps
- Initialize the root `.env` file based on the provided template: `$ cp .env.example .env`
- In the `.env` file, replace the default `BOT_TOKEN` value by the Secret Token provided by that bot
- Also initialize the `functions/.env` file: `$ cp functions/.env.example functions/.env`
- Take note of the bot name (ends with `bot`), we'll need it later

### 2. Create a Firebase project

- Go to [your firebase console](https://console.firebase.google.com)
- Add a new project
- In the `.firebaserc` file, replace `telegram-scribe-bot` by the id of that project

### 3. Deploy and bind the bot to Telegram

- `$ make setup-firebase` (to login to your Firebase account)
- `$ make deploy-firebase` (will upload the source code to your Firebase project)
- In the root `.env` file, replace the default `ROUTER_URL` value by the one printed when deploying (previous step), it must end with `/router/`
- `$ make test-firebase` (to check that the function deployed on Firebase responds)
- `$ make bind-firebase-webhook` (to bind that function to your Telegram bot)
- `$ make test-firebase-webhook` (to check that the function's router URL was properly bound to your Telegram bot)

After making any change to your bot, don't forget to deploy again it using `$ make deploy-firebase`.

### 4. Test your bot

- In your Telegram app, start a conversation with your bot (e.g. mine is [@aj_scribe_bot](t.me/aj_scribe_bot))
- Send "hello"
- The bot should reply with your name

You can troubleshoot your bot using [your firebase console](https://console.firebase.google.com).

### Options

Set `TELEGRAM_ONLY_FROM_USER_ID` in your `functions/.env` file and call `$ make deploy-firebase` again if you want the bot to only respond to that Telegram user identifier.

## How to add a command

The steps are listed in the order I usually follow:

1. In the `commandHandlers` array of `src/messageHandler.ts`, add an entry for your command. At first, make it return a simple `string`, like we did for the `/version` command. Deploy it and test it in production, just to make sure that you won't be blocked later at that critical step.

2. Write an automated test in `src/use-cases/`, to define the expected reponse for a sample command. (see [example](https://github.com/adrienjoly/telegram-scribe-bot/pull/24/commits/d52320b905ad9392472dd28f26abbb4fdc07ee8e))

3. Write a minimal `CommandHandler`, just to make the test pass, without calling any 3rd-party API yet. (see [example](https://github.com/adrienjoly/telegram-scribe-bot/pull/24/commits/cfc22c626b58c5e268d825aa1c2fff691ff16228))

4. Write a small tool to examine the response from the 3rd-party API. (see [example](https://github.com/adrienjoly/telegram-scribe-bot/pull/24/commits/792fbf7d669e8386d5e17c8f50b23623156b99f9))

5. Update the implementation of your `CommandHandler`, so it relies on the actual API response. Make sure that the test passes, when you provide your API credentials. (see [example](https://github.com/adrienjoly/telegram-scribe-bot/pull/24/commits/565cb21a10b8cfd1e44390227976541e62439d2c))

6. Make the automated test mock the API request(s) so that it doesn't require API credentials to run. (see [example](https://github.com/adrienjoly/telegram-scribe-bot/pull/24/commits/b3f4a23a375c49fe152735df41bafef880b77abc))

   > In that step, you can leverage the `⚠ no match for [...]` logs displayed when running your test from step 5, in order to know which URL(s) to mock.

7. Test your command locally, using `$ make test-bot`.

8. Deploy and test your command in production, as explained above.

## ToDo / Next steps

- Make setup easier and faster, e.g. by automatizing some of the steps
- ideas of "command" use cases to implement:
  - `/next [#tag]` will list the next `task` for each Trello card associated with `#tag`
  - `/search <text> [#tag [#...]]` will search occurrences of `text` in comments of Trello cards, optionally filtered by `#tags`
  - `/openwhyd <youtube_video_url> [description]` will post a YouTube track to Openwhyd.org, with `desc`ription (optional)
  - `/issue <repo>` will create a github issue on the provided repo
  - `/bk <url> [desc] [#tag]>` will create a Diigo bookmark to that URL
  - `/met "<person name>" [@place] [#tag] [desc]` will create or update a Google Contact
  - `/convert` units of measure into others (e.g. timezones, sizes, currencies, data formats...)
- ideas of "request" use cases to implement:
  - when waking up: invite to keep a note of the dream you were having
  - before going to sleep: invite to keep a note of how was your day (i.e. mood) and of what you did that day (i.e. journal), possibly with a photo to illustrate it
- read [issues](https://github.com/adrienjoly/telegram-scribe-bot/issues) for more.

## FAQ

### Is this yet another chatbot or virtual assistant supposedly supported by AI?

No. It's actually pretty dumb. Think of it more like a terminal, or like MacOS' Spotlight feature: it uses Telegram as a way to save text to other services, through their API. That's it.

### Why rely on Telegram?

Sending data from a mobile terminal to a server is far from trivial. For instance, your internet connection may be unstable (or unexistent) at the time when you want to save something. In that case, you'd expect your message to be automatically re-sent as soon as your internet connectivity is back. Telegram provides that out of the box! ✨
