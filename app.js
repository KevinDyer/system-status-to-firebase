(() => {
  'use strict';

  process.on('uncaughtException', (e) => console.log(e.stack));

  const path            = require('path');
  const winston         = require('winston');
  const parseArgs       = require('minimist');
  const GpsService      = require('./lib/gps-service');
  const SignInService   = require('./lib/signin-service');
  const LocationHistory = require('./lib/location-history');
  const firebase        = require('firebase');

  const config = {
    apiKey: "AIzaSyDMRSBYIJRexb7qlH5tCHnG75WV8rG-DBQ",
    authDomain: "system-status-13c93.firebaseapp.com",
    databaseURL: "https://system-status-13c93.firebaseio.com",
    storageBucket: "system-status-13c93.appspot.com",
  };

  firebase.initializeApp(config);

  const args = parseArgs(process.argv, {default: {output: null}, alias: {output: ['o']}});

  let logFilePath = 'log.txt';
  if ('string' === typeof(args.output)) {
    if (!path.isAbsolute(args.output)) {
      args.output = path.resolve(process.cwd(), args.output);
    }
    logFilePath = path.join(args.output, logFilePath);
  }

  const logger = new winston.Logger({
    level: 'debug',
    transports: [
      new winston.transports.Console({timestamps: true, colorize: true, prettyPrint: true}),
      new winston.transports.File({filename: logFilePath})
    ]
  });

  class Runner {
    constructor() {
      this.signInService = new SignInService();
      this.gpsService = new GpsService();
      this.locationHistory = new LocationHistory(this.signInService, this.gpsService);
    }

    start() {
      logger.debug('start');
      return this.signInService.signIn()
      .then(() => this.gpsService.start({reconnect: true}));
    }

    stop() {
      logger.debug('stop');
      return this.gpsService.stop();
    }
  }

  const runner = new Runner();

  runner.start()
  .catch((err) => console.log(err.stack));
})();
