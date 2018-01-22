"use strict";

// load the .env files variables
require('dotenv').config()

const http         = require('http')
const process      = require('process')
const MessengerBot = require('messenger-bot')

const l3cBot = new MessengerBot({
    token:  process.env.PAGE_ACCESS_TOKEN,
    verify: process.env.PAGE_VERIFY_TOKEN
})


l3cBot.on('error', function(err) {
    console.log(`Global error: ${err.message}`)
})

// TODO: extract callback
// TODO: add method to handle set of messages
l3cBot.on('message', (payload, reply) => {
    let text = payload.message.text

    reply({ text }, (err) => {
        if (err) {
            console.log(`Reply error: ${err.message}`)
        }

        console.log(`Echoed back : ${text}`)
    })
})


const port = process.env.PORT || 5555

http.createServer(l3cBot.middleware()).listen(port, () => {
    console.log('L3C bot started !')
})