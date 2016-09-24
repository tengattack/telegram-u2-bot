#!/usr/bin/env babel-node

import BotApi from './lib/botapi'
import U2 from './lib/u2'

import config from './config'

const { allowChatIds } = config

process.on('uncaughtException', err => {
  console.error('Error caught in uncaughtException event:', err)
})

const u2 = new U2(config.accessCookie)
const bot = new BotApi(config.botToken)

let torrentIds = []
function torrentsMessageHTML(torrents) {
  const torrentLines = torrents.map((t, i) => {
    return `${i + 1}. ${t.sticky ? '[置顶] ' : ''}`
         + '<a href="https://u2.dmhy.org/details.php?id=' + t.id + '">'
         +   t.title
         + '</a>'
  })
  return torrentLines.join('\n')
}
function notifyUpdates(torrents) {
  const html = '新的种子：\n'
             + torrentsMessageHTML(torrents)
  allowChatIds.forEach(chat_id => {
    bot.sendMessage({
      chat_id,
      text: html,
    }, err => {
      if (err) {
        console.log(err)
      }
    })
  })
}
function startCheckTorrentsUpdates() {
  setInterval(() => {
    u2.getTorrentList().then(torrents => {
      const newTorrents = torrents.filter(t => torrentIds.includes(t.id))
      if (newTorrents.length > 0) {
        // notify all
        notifyUpdates(newTorrents)
        // update
        torrentIds = torrents.map(t => t.id)
      }
    })
  }, config.checkInterval)
}
u2.getTorrentList().then(torrents => {
  // init first torrent ids
  torrentIds = torrents.map(t => t.id)
  startCheckTorrentsUpdates()
})

bot.setCheck((cmd, upd) => {
  if (upd.message && upd.message.chat) {
    const chat = upd.message.chat
    // only allow group `U2娘电报基地`
    if (allowChatIds.includes(chat.id)) {
      return false
    }
  }
  return true
})

bot.commands.on('list', (upd, followString) => {
  const chat = upd.message.chat
  u2.getTorrentList().then(torrents => {
    const html = torrentsMessageHTML(torrents.slice(0, 10))
    bot.sendMessage({
      chat_id: chat.id,
      text: html,
    }, err => {
      if (err) {
        console.log(err)
      }
    })
  })
})

bot.start()
