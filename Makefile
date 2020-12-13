.DEFAULT_GOAL := help

install: ## Fetch JS dependencies.
	@cd functions; npm install

build: install
	@cd functions; npm run build

test: build ## Run tests
	@cd functions; npm test

lint: install ## Run ESLint
	@cd functions; npm run lint 

deploy: install ## Run ESLint
	@cd functions; npm run deploy:setup
	@cd functions; npm run deploy:config
	@cd functions; npm run deploy

help: ## This help.
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: fetch-deps install build test lint deploy help
