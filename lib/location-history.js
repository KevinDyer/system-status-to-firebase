(() => {
  'use strict';

  const firebase = require('firebase');
  const winston = require('winston');

  const logger = new winston.Logger({
    level: 'debug',
    transports: [
      new winston.transports.Console({timestamps: true, colorize: true, prettyPrint: true})
    ]
  });

  class LocationHistory {
    constructor(signInService, gpsService) {
      this.locationsRef = null;
      this._queue = [];

      const currentUser = firebase.auth().currentUser;
      if (null === currentUser) {
        signInService.once('signedIn', (currentUser) => {
          this.locationsRef = firebase.database().ref('locations/' + currentUser.uid);
          this._queue.forEach((tpvData) => this._onTpvData(tpvData));
          this._queue = [];
        });
      } else {
        this.locationsRef = firebase.database().ref('locations/' + currentUser.uid);
      }

      gpsService.on('TPV', this._onTpvData.bind(this));
    }

    _onTpvData(tpvData) {
      if (null !== this.locationsRef) {
        this.locationsRef.push(tpvData);
      } else {
        this._queue.push(tpvData);
      }
    }
  }

  module.exports = LocationHistory;
})();
