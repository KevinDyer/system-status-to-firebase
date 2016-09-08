(() => {
  'use strict';

  const MINIMUM_DISTANCE_CHANGED = 3; // meters

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

      this._lastTpvData = null;
    }

    _onTpvData(tpvData) {
      if (this._isNewTpvData(tpvData)) {
        logger.debug('New TPV data', tpvData);

        this._lastTpvData = tpvData;

        if (null !== this.locationsRef) {
          tpvData.class = null;
          tpvData.tag = null;
          tpvData.device = null;
          this.locationsRef.push(tpvData);
        } else {
          this._queue.push(tpvData);
        }
      }
    }

    _isNewTpvData(tpvData) {
      if (!tpvData) {
        return false;
      }
      if (null === this._lastTpvData) {
        return true
      }
      const distance = this.distance(this._lastTpvData, tpvData);
      return MINIMUM_DISTANCE_CHANGED  < distance;
    }

    distance(loc1, loc2) {
      const R = 6371e3; // metres
      const angle1 = loc1.lat * Math.PI / 180;
      const angle2 = loc2.lat * Math.PI / 180;
      const deltaLat = (loc2.lat-loc1.lat) * Math.PI / 180;
      const deltaLon = (loc2.lon-loc1.lon) * Math.PI / 180;

      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(angle1) * Math.cos(angle2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      const d = R * c;

      return d;
    }
  }

  module.exports = LocationHistory;
})();
