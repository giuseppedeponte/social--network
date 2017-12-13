const querystring = require('querystring');
const User = require('../models/User');
// Store if the user is connected or not in the database
module.exports.connect = (io, socket, user) => {
  user.updateSocket(socket.id)
      .then(() => {
        console.log(user._id + ' is now connected');
        socket.emit('Handshake++', 'Ping');
      })
      .catch((err) => {
        console.log(err);
      });
  socket.on('Handshake++', (data) => {
    console.log(data);
  });
  socket.on('disconnect', (reason) => {
    socket.disconnect(true);
    user.updateSocket()
        .then(() => {
          console.log(user._id + ' is now disconnected');
          console.log(user);
        })
        .catch((err) => {
          console.log(err);
        });
  });
  // Search for a friend
  socket.on('friendSearch', (query) => {
    query = querystring.parse(query);
    query.friendSearch = new RegExp(query.friendSearch,'i');
    User
    .find({
      $or: [
        { name: query.friendSearch },
        { email: query.friendSearch },
        { 'info.firstName': query.friendSearch },
        { 'info.lastName': query.friendSearch }
      ]
    })
    .select({
      name: 1,
      _id: 1,
      socket: 1
    })
    .then((result) => {
      result.map((person) => {
        person.isFriend = user.hasFriend(person._id);
      });
      console.log(io);
      socket.emit('friendSearch', result);
    })
    .catch((err) => {
      console.log(err);
      socket.emit('friendSearch', []);
    })
  })
};
