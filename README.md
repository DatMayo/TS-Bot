# TS-Bot
TeamSpeak Server can get really messy, if they have a lot of channels. This simple bot will help you a bit, organizing your TeamSpeak Server.

## What do I need ?
1. A TeamSpeak 3 Server (obviusly)
1. A (v)Server, where you can run this bot
1. A query login
1. The TS3 Query data (IP, Port, etc)

## So, how to set up the bot?
First of, rename `.example.env` to `.env`. Everything you'll need, you can configure yourself in this file. When you've done all your configuration, you need to install all of its dependencies:
```bash
npm run install
```
After you've installed all dependencies, you can build the script:
```bash
npm run build
```
You'll get 2 files: `bundle.plain.js` and `bundle.js`.

The `bundle.plain.js` file has bundled all the code written by us & everything from `./node_modules/`.

The `bundle.js`is the same, but encrypted. So it will be hard for someone outside to get into your code.

## Test the TS-Bot
There is an easy way to test if everything workes as expected. Just run:
```bash
npm run debug
```
If there were any errors, you'll see it

## Deploying
To get the script running, just copy the `bundle.js` & `.env` file to your server and run it.