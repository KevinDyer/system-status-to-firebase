(() => {
  'use strict';

  const EventEmitter  = require('events');
  const gpsd          = require('node-gpsd');
  const winston       = require('winston');

  const logger = new winston.Logger({
    level: 'debug',
    transports: [
      new winston.transports.Console({timestamps: true, colorize: true, prettyPrint: true})
    ]
  });

  class GpsService extends EventEmitter {
    constructor() {
      super();
      this.daemon = new gpsd.Daemon({logger: logger});
      this.listener = new gpsd.Listener({logger: logger});
    }

    start() {
      logger.debug('start');
      return this.startDaemon()
      .then(() => this.connectListener())
      .then(() => this.watchListener());
    }

    stop() {
      logger.debug('stop');
      this.unwatchListener();
      this.disconnectListener();
      this.stopDaemon();
    }

    startDaemon() {
      logger.debug('startDaemon');
      return new Promise((resolve, reject) => {
        this.daemon.once('error', reject);
        this.daemon.start(() => resolve());
      });
    }

    stopDaemon() {
      logger.debug('stopDaemon');
      return new Promise((resolve, reject) => {
        this.daemon.once('error', reject);
        this.daemon.stop(() => resolve());
      });
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
      this.listener.unwatch();
    }

    disconnectListener() {
      logger.debug('disconnectListener');
      return new Promise((resolve, reject) => {
        this.listener.once('error', reject);
        this.listener.disconnect(() => resolve());
      });
    }
  }

  module.exports = GpsService;
})();
