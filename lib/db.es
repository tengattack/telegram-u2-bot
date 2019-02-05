
import { MongoClient } from 'mongodb'

class DB {
  static create(opts, cb) {
    if (!DB.db) {
      initDB(opts, cb)
    } else {
      throw new Error('DB is a singleton class')
    }
  }
  collection(name) {
    return DB.db.collection(name)
  }
  close() {
    return DB.db.close()
  }
}

function initDB(opts, cb) {
  if (!opts) {
    cb('db config not found')
    return
  }

  let dsn = 'mongodb://' + opts.host
  if (opts.port) {
    dsn += ':' + opts.port
  }
  dsn += '/' + opts.db

  MongoClient.connect(dsn, function (err, db) {
    if (err) {
      console.error(err)
      if (cb) cb(err)
      return
    }

    DB.db = db
    console.log('Connected to database server.')

    if (cb) cb(null, db)
  })
}

export default DB
