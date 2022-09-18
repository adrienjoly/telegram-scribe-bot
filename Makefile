#!make

include .env

.DEFAULT_GOAL := help

install: ## Fetch JS dependencies.
	@cd functions; npm install

build: install ## Transpile TypeScript files into JavaScript
	@cd functions; npm run build

test: install ## Run automated tests
	@cd functions; npm test

lint: install ## Run ESLint
	@cd functions; npm run lint

release: install test build
	@echo "Making sure that you're on the main branch..."
	@git checkout | grep "master"
	@cd functions; npx release-it --no-npm.publish
	@echo "Now, go to https://github.com/adrienjoly/telegram-scribe-bot/tags, to create the Release"

deploy-firebase: setup-firebase install test build ## Deploy to Firebase Functions
	@cd functions; node tools/bot-config-firebase.js
	@cd functions; npx firebase deploy

setup-firebase: ## Logs you into your Firebase account
	@cd functions; npx firebase login
	@echo "Don't forget to specify your Firebase app id in .firebaserc, cf README.md"

test-firebase: ## Checks that the Firebase Function's responds
	@curl --silent -X POST -H "Content-Type:application/json" ${ROUTER_URL} -d '{"message":{"chat":{"id":1},"from":{"id":199893686,"first_name":"test_name"},"entities":[{"type":"bot_command","offset":0,"length": 8}],"text":"/version"}}'

bind-firebase-webhook: ## Binds the Firebase Function to your Telegram bot
	@curl --silent https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${ROUTER_URL} | grep --color=always "\"ok\":true"

test-firebase-webhook: ## Checks that the Firebase Function's router URL was properly bound to your Telegram bot
	@curl --silent https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo | grep --color=always "\"ok\":true"

firebase-logs: ## Reads logs from Firebase Functions
	@cd functions; npx firebase functions:log -n 1000

help: ## This help.
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: install build test lint release deploy-firebase setup-firebase test-firebase bind-firebase-webhook test-firebase-webhook firebase-logs help
