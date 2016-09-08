(() => {
  'use strict';

  const EventEmitter  = require('events');
  const path          = require('path');
  const winston       = require('winston');
  const parseArgs     = require('minimist');
  const firebase      = require('firebase');

  const logger = new winston.Logger({
    level: 'debug',
    transports: [
      new winston.transports.Console({timestamps: true, colorize: true, prettyPrint: true})
    ]
  });

  class SignInService extends EventEmitter {
    constructor() {
      super();

      const args = parseArgs(process.argv, {
        default: {
          config: null
        },
        alias: {
          config: ['c']
        }
      });

      if (null === args.config) {
        throw new Error('config parameter must be defined');
      }

      let config = args.config;
      if (!path.isAbsolute(config)) {
        config = path.resolve(process.cwd(), config);
      }

      this.config = require(config);
    }

    signIn() {
      logger.debug('Signing into firebase', this.config);
      return firebase.auth().signInWithEmailAndPassword(this.config.email, this.config.password)
      .then(() => this.emit('signedIn', firebase.auth().currentUser))
      .catch((err) => {
        logger.error('Failed to sign in: %s', err.toString());
        return Promise.reject(err);
      });
    }
  }

  module.exports = SignInService;
})();
