
import EventEmitter from 'events'
import request from 'request'

const TG_BOT_URL = 'https://api.telegram.org/bot'
const DEF_LONG_POLLING_TIMEOUT = 30 // 30s

class BotApiCommands extends EventEmitter {}

export default class BotApi {
  constructor(token, opts) {
    this.commands = new BotApiCommands()
    this.events = new EventEmitter()
    this.token_url = TG_BOT_URL + token
    this.opts = opts || {}
    this.check_fn = null
    this.firststart = true

    const self = this
    // mute 2s for start up
    setTimeout(() => {
      self.firststart = false
    }, 2000)
  }
  urlMethod(method) {
    return this.token_url + '/' + method
  }
  setCheck(fn) {
    this.check_fn = fn
  }
  start() {
    this.polling()
  }
  process(upd) {
    // process single update
    let text = null
    if (upd.message) {
      const enti = upd.message.entities
      if (enti && typeof(enti[0]) === 'object' && enti[0].type === 'bot_command') {
        //var chat_id = msg.chat.id
        text = upd.message.text
      }
    } else if (upd.callback_query) {
      text = upd.callback_query.data
    }

    if (text) {
      const m = text.match(/^\/([^\s]+)(\s+([\S\s]*))?/)

      if (m && m[1]) {
        const cmds = m[1].split('@')
        if (cmds.length > 1 && this.opts.botName) {
          // check bot name
          if (cmds[1] !== this.opts.botName) {
            return
          }
        }
        if (this.check_fn) {
          if (this.check_fn(cmds[0], upd)) {
            // pass
            return
          }
        }
        this.commands.emit(cmds[0], upd, m[3])
      }
    }
  }
  polling() {
    const self = this
    this.getUpdates((err, updates) => {
      if (err && err.code === 'ETIMEDOUT') {
        // long polling time out.
        self.polling()
        return
      }
      if (err) {
        console.error(err)
      } else if (this.firststart) {
        if (updates.length > 0) {
          self.update_id = updates[updates.length - 1].update_id + 1
        }
        this.firststart = false
      } else {
        this.events.emit('begin', updates.length)

        // it should be an array
        updates.forEach(function (upd) {
          if (upd.update_id) {
            // Identifier of the first update to be returned.
            // Must be greater by one than the highest among the identifiers
            //   of previously received updates.
            self.update_id = upd.update_id + 1
          }
          self.process(upd)
          self.lastupd = upd
        })

        this.events.emit('end', updates.length)
      }
      // go on polling
      self.polling()
    })
  }
  post(method, formdata, opts, cb) {
    const _opts = {
      method: 'POST',
      url: this.urlMethod(method),
      gzip: true,
      json: true,
    }
    if (!opts.formData) {
      _opts.form = formdata
    }
    if (this.opts.proxyUrl) {
      _opts.proxy = this.opts.proxyUrl
      //_opts.tunnel = false
    }
    if (typeof(opts) === 'function') {
      cb = opts
      opts = {}
    }
    opts = { ..._opts, ...opts }

    request(opts, (err, resp, body) => {
      if (err) {
        cb(err)
      } else if (typeof(body) === 'object') {
        if (body.ok) {
          //if (typeof(body.result) === 'object') {
          cb(null, body.result)
          /*} else {
            cb('unformatted result')
          }*/
        } else {
          cb(body)
        }
      } else {
        cb(body ? body : 'unknown error')
      }
    })
  }
  getUpdates(cb) {
    const formdata = {
      timeout: DEF_LONG_POLLING_TIMEOUT,
    }
    if (this.update_id) {
      formdata.offset = this.update_id
    }

    this.post('getUpdates', formdata, {
      timeout: DEF_LONG_POLLING_TIMEOUT * 1000,
    }, cb)
  }
  sendMessage(params, cb) {
    if (params) {
      if (!('parse_mode' in params)) {
        params.parse_mode = 'HTML'
      }
      if (!('disable_web_page_preview' in params)) {
        params.disable_web_page_preview = true
      }
    }
    this.post('sendMessage', params, cb ? cb : () => {})
  }
  sendPhoto(params, cb) {
    this.post('sendPhoto', null, { formData: params }, cb ? cb : () => {})
  }
  answerCallbackQuery(params, cb) {
    this.post('answerCallbackQuery', params, cb ? cb : () => {})
  }
  editMessageText(params, cb) {
    this.post('editMessageText', params, cb ? cb : () => {})
  }
  editMessageReplyMarkup(params, cb) {
    this.post('editMessageReplyMarkup', params, cb ? cb : () => {})
  }
  getChatAdministrators(params, cb) {
    this.post('getChatAdministrators', params, cb ? cb :() => {})
  }
}
