/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const { Core, Events, State } = require('@adobe/aio-sdk')
const { context, getToken } = require('@adobe/aio-lib-ims')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
const fetch = require('node-fetch')

async function sendToExternalWebhook(externalWebhook, msg, logger) {

  logger.info('start send to external')
  var externalMessage = " Event received: " + msg;
  var payload = {
    "text": externalMessage,
  }

  var options = {
    method: 'POST',
    headers:
        { 'Content-type': 'application/json' },
    body: JSON.stringify(payload)
  }
  
  return await fetch(externalWebhook, options)
}

async function fetchEvent(params, token, since) {
  const eventsClient = await Events.init(params.ims_org_id, params.apiKey, token)

  let options = {}
  if(since != undefined) {
    options.since = since
  }
  journalling = await eventsClient.getEventsFromJournal(params.journalling_url, options)
  
  return journalling.events
}

async function saveToDb(params, new_events) {
  const stateCLient = await State.init()


  var events = await stateCLient.get(params.db_event_key) 
  if (events === undefined) {
    events = {latest: new_events[new_events.length - 1], events: new_events}
  } else {
    events = events.value
    events.latest = new_events[new_events.length - 1]
    events.events.push(new_events)
  }
  await stateCLient.put(params.db_event_key, events, { ttl: -1 })
}

async function getLatestEventPosition(params) {
  const stateCLient = await State.init()
  const events = await stateCLient.get(params.db_event_key)
  if (events === undefined) {
    return undefined
  } else {
    return events.value.latest.position
  }
}

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))

    const config = {
      client_id: params.client_id,
      client_secret: params.client_secret,
      technical_account_email: params.technical_account_email,
      technical_account_id: params.technical_account_id,
      meta_scopes: ['ent_adobeio_sdk'],
      ims_org_id: params.ims_org_id,
      private_key: params.private_key
    };
    await context.set('my_event_provider', config)
    await context.setCurrent('my_event_provider')

    const token = await getToken()


    var latestEventPos = await getLatestEventPosition(params)
    if (latestEventPos === undefined) {
      logger.info("Fetch Event since first position")
    } else {
      logger.info("Fetch Event since position: " + latestEventPos)
    }

    var fetch_cnt = 0
    var total_event_num = 0
    var events = await fetchEvent(params, token, latestEventPos)
    logger.info('before while events')
    while (events != undefined) {
      logger.info("Got %d events, send it to external webhook and save to DB, last event position is: %s", events.length, events[events.length - 1].position)
      await saveToDb(params, events)
      msg = JSON.stringify(events)
      if (params.external_webhook != undefined) {
        await sendToExternalWebhook(params.external_webhook, msg, logger)
      }

      total_event_num = total_event_num + events.length
      fetch_cnt = fetch_cnt + 1
      if (fetch_cnt >= params.max_events_in_batch) {
        break
      }
      events = await fetchEvent(params, token, events[events.length - 1].position)
    }
    logger.info('after while events')
    return { event_fetched: total_event_num }

  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main
