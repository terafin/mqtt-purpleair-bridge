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

if (_.isNil(topic_prefix)) {
    logging.warn('TOPIC_PREFIX not set, not starting')
    process.abort()
}

var mqttOptions = {}

var shouldRetain = process.env.MQTT_RETAIN

if (_.isNil(shouldRetain)) {
    shouldRetain = false
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
    logging.info('purpleair request url: ' + url)
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

const checkPurpleAirHost = function() {
    query_purpleair_host(function(err, result) {
        if (!_.isNil(err)) {
            health.unhealthyEvent()
            return
        }

        Object.keys(result).forEach(metric => {
            client.smartPublish(topic_prefix + '/' + metric.toString(), result[metric].toString())
        });

        health.healthyEvent()
    })
}

const startHostCheck = function() {
    logging.info('Starting to monitor: ' + purpleair_host)
    interval(async() => {
        checkPurpleAirHost()
    }, 10 * 1000)
    checkPurpleAirHost()
}

startHostCheck()