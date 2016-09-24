#!/usr/bin/env babel-node

import request from 'request'

import BotApi from './lib/botapi'
import U2 from './lib/u2'

import config from './config'

const u2 = new U2(config.accessCookie)
u2.getTorrentList().then(torrents => {
  console.log(torrents)
})
