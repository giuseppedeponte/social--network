const querystring = require('querystring');
const User = require('../models/User');
const escapeRegExp = (str) => {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};
const pug = require('pug');
const profileWallPost = pug.compileFile('./views/profileWallPost.pug');
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
  // Create a post
  socket.on('createPost', (query) => {
    query = querystring.parse(query);
    if (query.postText && query.postAuthor && query.userId) {
      User
      .findOne({'_id': query.userId})
      .then((u) => {
        return u.createPost(query.postText, query.postAuthor);
      })
      .then((us) => {
        let post = profileWallPost({
          post: us.posts[0],
          user: {
            _id: us._id
          },
          viewer: {
            name: user.name,
            email: user.email
          }
        });
        socket.emit('createPost', {
          postId: us.posts[0]._id,
          html: post
        });
      })
      .catch((err) => {
        console.log(err);
      });
    }
  });
  // Comment a post
  socket.on('commentPost', (query) => {
    query = querystring.parse(query);
    if (query.commentText && query.commentAuthor && query.postId) {
      user.commentPost(query.commentText, query.commentAuthor, query.postId)
      .then((post) => {
        postHtml = profileWallPost({
          post: post,
          user: {
            _id: post.user
          },
          viewer: {
            name: user.name,
            email: user.email
          }
        });
        socket.emit('commentPost', {
          postId: post._id,
          html: postHtml
        });
      })
      .catch((err) => {
        console.log(err);
      })
    }
  });
  // Search for a friend
  socket.on('friendSearch', (query) => {
    query = querystring.parse(query);
    query.friendSearch = new RegExp(escapeRegExp(query.friendSearch),'i');
    let filter;
    if (user.hasRole('admin')) {
      filter = {};
    } else {
      filter = {
        $or: [
          { name: query.friendSearch },
          { email: query.friendSearch },
          { 'info.firstName': query.friendSearch },
          { 'info.lastName': query.friendSearch }
        ]
      };
    }
    User
    .find(filter)
    .select({
      name: 1,
      _id: 1,
      socket: 1,
      email: 1
    })
    .then((result) => {
      let users = [];
      result.map((person) => {
        if (!user._id.equals(person._id)) {
          let online = typeof io.sockets.connected[person.socket] !== 'undefined';
          users.push({
            name: person.name,
            email: person.email,
            _id: person._id,
            socket: person.socket,
            online: online,
            isFriend: user.hasRole('admin') || user.hasFriend(person._id) ? true : false
          });
        }
      });
      socket.emit('friendSearch', users);
    })
    .catch((err) => {
      console.log(err);
      socket.emit('friendSearch', []);
    })
  })
};
