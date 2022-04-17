# Aurionstaff

## Description

Bot discord for Mineaurion Staff. All the command have a restriction on a role name "Staff".

## Install

### Bot Token

You need a bot token, follow the discord.js to have one and the add the bot to your server : https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot

### Install dependencies

```bash
npm ci --production
```

### Configuration

```bash
cp .env.example .env
```

Replace the configuration with your configuration

## Start

```
npm run build
npm run serve
```

And you are good to go, the bot will start and serve an api and the bot itself on your discord

## Development

For the development, you need to have prettier and eslint extension to have better integration. For better usage, create a bot token and add the bot into a "dev server", so you can freely dev without "breaking" your main discord.

```
npm ci
npm run start
```
