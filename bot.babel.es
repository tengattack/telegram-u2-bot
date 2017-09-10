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
let invitePrice = null
function getMetaInfo(t) {
  let meta = ''
  if (t.sticky) {
    meta += '<b>[置顶]</b> '
  }
  if (t.promotion) {
    const { up, down } = t.promotion
    let mp = ''
    if (typeof up !== 'undefined' && up !== 1) {
      mp += `${up}x`
    }
    if (typeof down !== 'undefined' && down !== 1) {
      if (mp) mp += '|'
      if (down <= 0) {
        mp += 'free'
      } else {
        mp += `${down}`
      }
    }
    if (mp) {
      meta += `<b>[${mp}]</b> `
    }
  }
  return meta
}
function torrentsMessageHTML(torrents) {
  const torrentLines = torrents.map((t, i) => {
    const meta = getMetaInfo(t)
    return `${i + 1}. ${meta}`
         + '<a href="https://u2.dmhy.org/details.php?id=' + t.id + '">'
         +   t.title
         + '</a>'
  })
  return torrentLines.join('\n')
}
function notifyUpdates(type, data, oldData) {
  let html
  switch (type) {
  case 'torrent':
    html = '新的种子：\n'
        + torrentsMessageHTML(data)
    break
  case 'invite_price':
    html = '新的邀请价格: '
    if (oldData) {
      html += `<b>${oldData}</b> -> `
    }
    html += `<b>${data}</b> UCoin`
    break
  default:
    return
  }
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
      const newTorrents = torrents.filter(t => !torrentIds.includes(t.id))
      if (newTorrents.length > 0) {
        // notify all
        notifyUpdates('torrent', newTorrents)
        // update
        torrentIds = torrents.map(t => t.id)
      }
    })
    u2.getInvitePrice().then(price => {
      if (price !== invitePrice) {
        // notify all
        if (price) {
          notifyUpdates('invite_price', price, invitePrice)
        }
        // update
        invitePrice = price
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

bot.commands.on('invite_price', (upd, followString) => {
  const chat = upd.message.chat
  u2.getInvitePrice().then(price => {
    const html = `当前邀请价格: <b>${price}</b> UCoin`
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
