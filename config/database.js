'use strict';
module.exports = {
  url: 'mongodb://localhost:27017/social-network',
  options: {
    useMongoClient: true,
    socketTimeoutMS: 0,
    keepAlive: true,
    reconnectTries: 30
  }
};
