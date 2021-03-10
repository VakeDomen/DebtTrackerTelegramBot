'use strict';

const async = require("async");

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  async.series([
    db.createTable.bind(db, 'ledger', ledger),
    db.createTable.bind(db, 'transactions', transactions),
    db.createTable.bind(db, 'users', users),
  ], callback);
};

exports.down = function(db, callback) {
  async.series([
    db.dropTable.bind(db, 'ledger'),
    db.dropTable.bind(db, 'transactions'),
    db.dropTable.bind(db, 'users'),
  ], callback);
};

exports._meta = {
  "version": 1
};

const ledger = {
  columns: {
    id: {
      type: 'string',
      primaryKey: true,
      autoIncrement: false
    },
    dolzink: {
      type: 'string',
    },
    upnik: {
      type: 'string',
    },
    vsota: {
      type: 'string',
    }
  },
  ifNotExists: true
};

const transactions = {
  columns: {
    id: {
      type: 'string',
      primaryKey: true,
      autoIncrement: false
    },
    tip: {
      type: 'string',
    },
    kdo: {
      type: 'string',
    },
    komu: {
      type: 'string',
    },
    vsota: {
      type: 'real',
    },
    description: {
      type: 'string',
    },
    created: {
      type: 'datetime',
    },
  }, 
  ifNotExists: true
};

const users = {
  columns: {
    id: {
      type: 'string',
      primaryKey: true,
      autoIncrement: false
    },
    telegram_id: {
      type: 'string',
    },
    name: {
      type: 'string'
    }
  }, 
  ifNotExists: true
};
