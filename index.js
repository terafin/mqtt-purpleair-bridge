const mqtt = require('mqtt')
const _ = require('lodash')
const logging = require('homeautomation-js-lib/logging.js')
const interval = require('interval-promise')
const health = require('homeautomation-js-lib/health.js')
const got = require('got')
const mqtt_helpers = require('homeautomation-js-lib/mqtt_helpers.js')

// Config
var topic_prefix = process.env.TOPIC_PREFIX
var purpleair_host = process.env.PURPLE_AIR_HOST
var purpleair_station = process.env.PURPLE_AIR_STATION

if (_.isNil(topic_prefix)) {
    logging.warn('TOPIC_PREFIX not set, not starting')
    process.abort()
}

var mqttOptions = {}

var shouldRetain = process.env.MQTT_RETAIN

if (_.isNil(shouldRetain)) {
    shouldRetain = true
}

if (!_.isNil(shouldRetain)) {
    mqttOptions['retain'] = shouldRetain
}

var connectedEvent = function() {
    health.healthyEvent()
}

var disconnectedEvent = function() {
    health.unhealthyEvent()
}

// Setup MQTT
const client = mqtt_helpers.setupClient(connectedEvent, disconnectedEvent)

async function query_purpleair_host(callback) {
    const urlSuffix = '/json'
    const url = 'http://' + purpleair_host + urlSuffix
    logging.info('purpleair local request url: ' + url)
    var error = null
    var body = null

    try {
        const response = await got.get(url)
        body = JSON.parse(response.body)
    } catch (e) {
        logging.error('failed querying host: ' + e)
        error = e
    }

    if (!_.isNil(callback)) {
        return callback(error, body)
    }
}

async function query_purpleair_station(station, callback) {
    const url = 'https://www.purpleair.com/json?show=' + station
    logging.info('purpleair station request url: ' + url)
    var error = null
    var body = null
    var results = null

    try {
        const response = await got.get(url)
        body = JSON.parse(response.body)
        results = body.results[0]
    } catch (e) {
        logging.error('failed querying station: ' + e)
        error = e
    }

    if (!_.isNil(callback)) {
        return callback(error, results)
    }
}

const pollPurpleAir = function() {
    if (!_.isNil(purpleair_host)) {
        query_purpleair_host(function(err, result) {
            if (!_.isNil(err)) {
                health.unhealthyEvent()
                return
            }

            client.smartPublishCollection(topic_prefix, result, [], mqttOptions)

            health.healthyEvent()
        })
    }

    if (!_.isNil(purpleair_station)) {
        query_purpleair_station(purpleair_station, function(err, result) {
            if (!_.isNil(err)) {
                health.unhealthyEvent()
                return
            }

            client.smartPublishCollection(mqtt_helpers.generateTopic(topic_prefix, purpleair_station), result, ['Stats'], mqttOptions)

            if (!_.isNil(result.Stats)) {
                client.smartPublishCollection(mqtt_helpers.generateTopic(topic_prefix, purpleair_station, 'stats'), JSON.parse(result.Stats), [], mqttOptions)
            }

            health.healthyEvent()
        })
    }
}

const startHostCheck = function() {
    if (!_.isNil(purpleair_host)) {
        logging.info('Starting to monitor host: ' + purpleair_host)
    }

    if (!_.isNil(purpleair_station)) {
        logging.info('Starting to monitor station: ' + purpleair_station)
    }

    interval(async() => {
        pollPurpleAir()
    }, 10 * 1000)
    pollPurpleAir()
}

startHostCheck()