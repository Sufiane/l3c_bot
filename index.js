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

/**
 * Simple function to pass as callback to reply function on event 'message'
 *
 * @param {object} err - reply error object
 */
const simpleMessageCallback = (err) => {
    // todo: reply with an error message
    if (err) {
        console.log(`Reply error: ${err.message}`)
    }
}

l3cBot.on('message', (payload, reply) => {
    console.log('---- payload', payload)

    const text = payload.message.text

    return handleUserCommand(text)
        .then(messages => {
            messages.forEach(message => {
                l3cBot.sendMessage(payload.sender.id, message, simpleMessageCallback)
            })
        })
        .catch(errorMessage => {
            reply({ text: errorMessage }, simpleMessageCallback)
        })
})

/**
 * Handle the user command
 *
 * @param {string} message - the user message/command
 * @returns {Promise.<object>}
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
        case constants.easterEgg:
            return Promise.resolve([ { text: 'Pocoyo Pocoyo !! O:)' }])
        default:
            return Promise.reject(`Désolé je ne comprends que les méthodes qui font parties de cette liste: ${constants.commandList}`)
    }
}

/**
 * Return all the movie titles from a movie list
 *
 * @param {array} movieList - TMDB movie list response for the selected endpoint
 * @returns {array.<object>} - a concatenation of movie titles
 */
const formatMovieList = (movieList) => {
    return movieList
        .map(movie => {
            return {
                title: movie.title,
                subtitle: movie.overview,
                image_url: `${constants.TMDB_IMAGE_URL}${movie.poster_path}`,
            }
        })

}

/**
 * Split the initial movie list into sublist of 4 movie each since messenger doesn't allow a list to have more than 4 objects
 *
 * @param {array<object>} movieList - array of movies object
 * @returns {Array.<array.<object>>} - a list of smaller list (max 4 object for sublist)
 */
const handleMovieList = (movieList) => {
    const motherList = []

    let i = 0
    do {
        const subListLimit = i + 4

        motherList.push(movieList.slice(i, subListLimit))

        i = subListLimit
    } while(motherList.length < movieList.length / 4)

    return motherList
}

/**
 * Request the given TMDB endpoint
 *
 * @param {string} endpoint - the endpoint to get
 * @returns {Promise.<object> | string } - return a promise of a TMDB object response
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
            return formatMovieList(response.results)
        })
        .then(handleMovieList)
        .then(movieList => {
            return movieList.map(subMovieList => {
                return {
                    attachment: {
                        type:    'template',
                        payload: {
                            template_type:     'list',
                            top_element_style: 'compact',
                            elements:          subMovieList
                        }
                    }
                }
            })
        })
        .catch(err => {
            return `Sorry an error occurred ! :/ we'll dive into it ! ${err.message}`
        })
}


const port = process.env.PORT || 5555

http.createServer(l3cBot.middleware()).listen(port, () => {
    console.log('L3C bot started !')
})