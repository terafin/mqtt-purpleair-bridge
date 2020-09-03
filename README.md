# mqtt-purpleair-bridge

This is a simple docker container that I use to bridge to/from my MQTT bridge.

I have a collection of bridges, and the general format of these begins with these environment variables:

```
      TOPIC_PREFIX: /your_topic_prefix  (eg: /some_topic_prefix/somthing)
      MQTT_HOST: YOUR_MQTT_URL (eg: mqtt://mqtt.yourdomain.net)
      (OPTIONAL) MQTT_USER: YOUR_MQTT_USERNAME
      (OPTIONAL) MQTT_PASS: YOUR_MQTT_PASSWORD
```

Here's an example docker compose:

```
version: '3.3'
services:
  mqtt-purpleair-bridge:
    image: terafin/mqtt-purpleair-bridge:latest
    environment:
      LOGGING_NAME: mqtt-purpleair-bridge
      TZ: America/Los_Angeles
      TOPIC_PREFIX: /your_topic_prefix  (eg: /energyusage)
      PURPLE_AIR_HOST: YOUR_PURPLE_AIR_IP
      HEALTH_CHECK_PORT: "3001"
      HEALTH_CHECK_TIME: "120"
      HEALTH_CHECK_URL: /healthcheck
      MQTT_HOST: YOUR_MQTT_URL (eg: mqtt://mqtt.yourdomain.net)
      (OPTIONAL) MQTT_USER: YOUR_MQTT_USERNAME
      (OPTIONAL) MQTT_PASS: YOUR_MQTT_PASSWORD
```

Here's an example publish for my setup:

```
/energyusage/ovens 0
/energyusage/register_3_4 -3
/energyusage/rack_furnace 1044
/energyusage/pool 1055
/energyusage/garage_entry_lights_outlets 6
/energyusage/entrance_lamp 13
/energyusage/register_25_pair___low_watt 0
/energyusage/attic_garage_outlets_lights 120
/energyusage/house 3530
/energyusage/fridge 78
```
