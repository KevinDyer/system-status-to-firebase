(() => {
  'use strict';

  const path      = require('path');
  const winston   = require('winston');
  const parseArgs = require('minimist');

  const args = parseArgs(process.argv, {default: {output: null}, alias: {output: ['o']}});

  console.log(require('util').inspect(args, { colors: true }));

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
      // TODO Add stuff
    }

    start() {
      logger.debug('start');
      return Promise.resolve();
    }

    stop() {
      logger.debug('stop');
      // TODO Perform clean up
    }
  }

  const runner = new Runner();

  process.on('exit', () => runner.stop());

  runner.start()
  .catch((err) => console.log(err.stack));
})();
