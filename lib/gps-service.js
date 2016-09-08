(() => {
  'use strict';

  const DELAY_RECONNECT_MS = 5 * 1000;

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
      this.listener = null;
    }

    createListener() {
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

      const listener = new gpsd.Listener({
        logger: logger,
        port: args.port,
        hostname: args.hostname
      });

      const events = ['TPV', 'SKY', 'INFO', 'DEVICE', 'raw', 'error', 'disconnected', 'connected'];
      const gpsService = this;
      events.forEach((event) => {
        listener.on(event, function () {
          const args = [].slice.call(arguments);
          args.unshift(event);
          gpsService.emit.apply(gpsService, args);
        });
      });

      return listener;
    }

    start(options) {
      logger.debug('start');
      return this.connectListener(options)
      .then(() => this.watchListener());
    }

    stop() {
      logger.debug('stop');
      this.unwatchListener();
      this.disconnectListener();
    }

    connectListener(options) {
      logger.debug('connectListener');

      options = options || {};

      let reconnect = false;
      if (options.hasOwnProperty('reconnect')) {
        reconnect = options.reconnect;
      }

      let block = true;
      if (options.hasOwnProperty('block')) {
        block = options.block;
      }
      if (!block) {
        return Promise.resolve();
      } else {
        return new Promise((resolve, reject) => {
          this.listener = this.createListener();
          this.listener.once('error.connection', () => reject(new Error('connection failed')));
          this.listener.once('error.socket', () => reject(new Error('socket failed')));
          this.listener.connect(resolve);
        })
        .catch((err) => {
          logger.debug('Failed to connect: %s', err.toString());
          if (reconnect) {
            return new Promise((resolve, reject) => setTimeout(resolve, DELAY_RECONNECT_MS))
            .then(() => this.connectListener(options));
          } else {
            return Promise.reject(err);
          }
        });
      }
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
