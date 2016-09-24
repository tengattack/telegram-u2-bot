
import request from 'request'

const U2_URL = 'https://u2.dmhy.org'

// https://github.com/tengattack/my-u2-rss/blob/master/index.php

export default class U2 {
  constructor(cookie) {
    this.cookie = cookie
  }
  httpGet(uri) {
    const url = `${U2_URL}${uri}`
    const cookie = this.cookie
    return new Promise((resolve, reject) => {
      request({
        method: 'GET',
        url,
        headers: {
          'Cookie': cookie,
        },
      }, (err, resp, body) => {
        if (err) {
          reject(err)
        } else {
          resolve(body)
        }
      })
    })
  }
  getTorrentInfo(torrenthtml) {
    const mat = torrenthtml.match(/<table class="torrentname".*?>([\s\S]*?)<\/table>/)
    if (!mat) {
      return
    }
    const mat2 = torrenthtml.match(/<td class="rowfollow nowrap"><(span|time) title="(.*?)"/i)
    if (!mat2) {
      return
    }
    const torrentname = mat[1]
    const matches = torrentname.match(/<a .*?href="details\.php\?id=(\d+).*?".*?>(.*?)<\/a>/i)
    if (!matches) {
      return
    }

    const timestamp = new Date(mat2[2])
    const torrent = {
      id: matches[1],
      title: matches[2],
      pubDate: timestamp,
    }

    const matches2 = torrentname.match(/<td class=".*?overflow-control">([\s\S]*?)<\/td>/g)
    if (matches2) {
      const submatches = []
      matches2.forEach(s => {
        const m = s.match(/<td class=".*?overflow-control">([\s\S]*?)<\/td>/)
        if (m) {
          submatches.push(m[1])
        }
      })
      if (submatches.length === 2) {
        // 置顶
        if (submatches[0].includes('<img class="sticky"')) {
          torrent['sticky'] = true
        }
        // 优惠信息
        const matches3 = submatches[1].match(/<img .*?class="(.+?)".*?/)
        if (matches3) {
          let pro = matches3[1]
          if (pro.startsWith('pro_')) {
            pro = pro.substr(4)
          }
          const promo = {
            up: 1,
            down: 1,
            type: pro,
          }
          if (pro === 'custom') {
            const matches4 = torrentname.match(/<img class="arrow(up|down)".*?<b>(.+?)X<\/b>/g)
            if (matches4) {
              const submatches2 = []
              matches4.forEach(s => {
                const m = s.match(/<img class="arrow(up|down)".*?<b>(.+?)X<\/b>/)
                if (m) {
                  submatches2.push([ m[1], m[2] ])
                }
              })
              for (const m of submatches2) {
                // promo[m[1]] = parseFloat(m[2])
                if (m[0] === 'up') {
                  promo['up'] = parseFloat(m[1])
                } else if (m[0] === 'down') {
                  promo['down'] = parseFloat(m[1])
                }
              }
            }
          } else {
            if (pro.includes('2up')) {
              promo['up'] = 2
            }
            if (pro.includes('free')) {
              promo['down'] = 0
            }
            if (pro.includes('30pctdown')) {
              promo['down'] = 0.3
            }
            if (pro.includes('50pctdown')) {
              promo['down'] = 0.5
            }
          }
          torrent['promotion'] = promo
        }
      }
    }

    return torrent
  }
  async getTorrentList() {
    const html = await this.httpGet('/torrents.php')
    if (!html) {
      return []
    }
    const torrents = []
    const mat = html.match(/<tr>([\s\S]*?<\/table>.*?)<\/tr>/g)

    for (const torrenthtml of mat) {
      const t = this.getTorrentInfo(torrenthtml)
      if (t) {
        torrents.push(t)
      }
    }

    return torrents
  }
}
