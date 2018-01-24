"use strict";

// load the .env files variables
require('dotenv').config()

const http         = require('http')
const process      = require('process')
const MessengerBot = require('messenger-bot')
const request      = require('request-promise')

const constants = require('./constants')

const l3cBot = new MessengerBot({
    token:  process.env.PAGE_ACCESS_TOKEN,
    verify: process.env.PAGE_VERIFY_TOKEN
})


l3cBot.on('error', function(err) {
    console.log(`Global error: ${err.message}`)
})

// TODO: need to be reworked !
/*
l3cBot.on('delivery', (payload, reply) => {
    reply({ text: 'Need something else? I\'m here if needed ! :) ' }, (err) => {
        if (err) {
            console.log(`Delivery error: ${err.message}`)
        }

        console.log('Delivery message successfully sent !')
    })
})
*/

l3cBot.on('message', (payload, reply) => {
    const text = payload.message.text

    return handleUserCommand(text)
        .then(result => {
            reply({ text: result }, (err) => {
                if (err) {
                    console.log(`Reply error: ${err.message}`)
                }

                console.log(`Answered: ${result}`)
            })
        })
})

/**
 * Handle the user command
 *
 * @param {string} message - the user message/command
 * @returns {Promise.<string>}
 */
const handleUserCommand = (message) => {
    switch(message) {
        case constants.upcoming:
            return requestMovieApi(constants.upcoming)
        case constants.popular:
            return requestMovieApi(constants.popular)
        case constants.topRated:
            return requestMovieApi(constants.topRated)
        case constants.nowPlaying:
            return requestMovieApi(constants.nowPlaying)
        default:
            return Promise.resolve(`Désolé je ne comprends que les méthodes qui font parties de cette liste: ${constants.commandList}`)
    }
}

/**
 * Return all the movie titles from a movie list
 *
 * @param {array} movieList - TMDB movie list response for the selected endpoint
 * @returns {string} - a concatenation of movie titles
 */
const handleMovieList = (movieList) => {
    return movieList
        .map(movie => movie.title)
        .join(', ')
}

/**
 * Request the given TMDB endpoint
 *
 * @param {string} endpoint - the endpoint to get
 * @returns {Promise.<string>} - return a promise of a TMDB object response
 */
const requestMovieApi = (endpoint) => {
    const options = {
        uri: `${constants.TMDB_API_URL}${endpoint}`,
        qs: {
            api_key: process.env.TMDB_API_TOKEN_V3,
            region: constants.region,
            language: constants.language
        },
        json: true
    }

    return request(options)
        .then(response => {
            return handleMovieList(response.results)
        })
        .catch(err => {
            return `Sorry an error occurred ! :/ we'll dive into it ! ${err.message}`
        })
}


const port = process.env.PORT || 5555

http.createServer(l3cBot.middleware()).listen(port, () => {
    console.log('L3C bot started !')
})