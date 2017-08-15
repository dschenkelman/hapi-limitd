'use strict';

const rimraf = require('rimraf');
const path  = require('path');
const xtend = require('xtend');
const LimitdServer = require('limitd').Server;
const LimitdClient = require('limitd-client');

let instanceNumber = 0;

function create(port) {

  port = port || 9001;

  let server;

  return {

    start: function(cb) {
      const db_file = path.join(__dirname, 'dbs', `server.${instanceNumber++}.tests.db`);

      try{
        rimraf.sync(db_file);
      } catch(err){}

      const conf = require('./limitdConfig');
      conf.db = db_file;
      server = new LimitdServer(xtend({db: db_file, port: port}, conf));

      server.start(function (err, address) {
        if (err) { return cb(err); }

        let client = new LimitdClient(`limitd://127.0.0.1:${port}`);
        client.once('connect', function(){
          client.disconnect();
          cb(null, address);
        });
      });
    },

    stop: function (cb) {
      server.once('close', function() {
        cb();
      });
      server.stop();
    }
  };
}

exports.create = create;

// backguard compatibility
const instance = create();

exports.start = function(done) {
  return instance.start(function(err, address) {
    done(address);
  });
};

exports.stop = function(done) {
  return instance.stop(done);
};

