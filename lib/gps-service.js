(() => {
  'use strict';

  const EventEmitter  = require('events');
  const gpsd          = require('node-gpsd');
  const winston       = require('winston');
  const parseArgs     = require('minimist');

  const logger = new winston.Logger({
    level: 'debug',
    transports: [
      new winston.transports.Console({timestamps: true, colorize: true, prettyPrint: true})
    ]
  });

  class GpsService extends EventEmitter {
    constructor() {
      super();

      const args = parseArgs(process.argv, {
        default: {
          hostname: 'localhost',
          port: 2947
        },
        alias: {
          hostname: ['h'],
          port: ['p']
        }
      });

      this.listener = new gpsd.Listener({
        logger: logger,
        port: args.port,
        hostname: args.hostname
      });
    }

    start(options) {
      logger.debug('start');
      return this.connectListener(options)
      .then(() => this.watchListener(options));
    }

    stop() {
      logger.debug('stop');
      this.unwatchListener();
      this.disconnectListener();
    }

    connectListener() {
      logger.debug('connectListener');
      return new Promise((resolve, reject) => {
        this.listener.once('error', reject);
        this.listener.connect(() => resolve());
      });
    }

    watchListener(options) {
      logger.debug('watchListener', options);
      this.listener.watch(options);
    }

    unwatchListener() {
      logger.debug('unwatchListener');
      if (this.listener.isConnected()) {
        this.listener.unwatch();
      }
    }

    disconnectListener() {
      logger.debug('disconnectListener');
      if (this.listener.isConnected()) {
        return new Promise((resolve, reject) => {
          this.listener.once('error', reject);
          this.listener.disconnect(() => resolve());
        });
      }
    }
  }

  module.exports = GpsService;
})();
