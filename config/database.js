'use strict';
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-network';
module.exports = {
  url: dbUri,
  options: {
    useMongoClient: true,
    socketTimeoutMS: 0,
    keepAlive: true,
    reconnectTries: 30
  }
};
