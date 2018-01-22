const querystring = require('querystring');
const User = require('../models/User');
const Post = require('../models/Post');
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
        socket.emit('Handshake++', user._id);
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
    if (query.postText && query.postAuthor && query.postAuthorId && query.userId) {
      User
      .findOne({'_id': query.userId})
      .then((u) => {
        return u.createPost(query.postText, query.postAuthor, query.postAuthorId);
      })
      .then((us) => {
        let post = profileWallPost({
          post: us.posts[0],
          isOwner: us._id.equals(user._id),
          isAdmin: user.role === 'admin',
          user: {
            _id: us._id
          },
          viewer: {
            name: user.name,
            email: user.email,
            _id: user._id
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
          isOwner: post.user.equals(user._id),
          isAdmin: user.role === 'admin',
          user: {
            _id: post.user
          },
          viewer: {
            name: user.name,
            email: user.email,
            _id: user._id
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
  socket.on('deletePost', (postId) => {
    if (postId) {
      Post
      .findOne({ '_id': postId})
      .populate('user')
      .then((post) => {
        if (user._id.equals(post.user._id)
            || user._id.equals(post.authorId)
            || user.role === 'admin') {
          post.user.deletePost(postId)
          .then((id) => {
            socket.emit('deletePost', id);
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
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
      users = {};
      users.friends = [];
      users.others = [];
      result.map((person) => {
        if (!user._id.equals(person._id)) {
          let online = typeof io.sockets.connected[person.socket] !== 'undefined';
          let u = {
            name: person.name,
            email: person.email,
            _id: person._id,
            socket: person.socket,
            online: online,
            isFriend: user.hasRole('admin') || user.hasFriend(person._id) ? true : false
          };
          if (u.isFriend) {
            users.friends.push(u);
          } else {
            users.others.push(u);
          }
        }
      });
      socket.emit('friendSearch', users);
    })
    .catch((err) => {
      console.log(err);
      socket.emit('friendSearch', []);
    });
  });
  // Send Friend Request
  socket.on('addFriend', (friendId) => {
    if (user._id.equals(friendId)
    || user.friends.indexOf(friendId) > -1
    || user.friendRequests.sent.indexOf(friendId) > -1
    || user.friendRequests.received.indexOf(friendId) > -1) {
      return;
    }
    User.findOne({ '_id': friendId })
    .then((person) => {
      if (person.friendRequests.received.indexOf(user._id) > 1) {
        throw new Error('friend request already received');
      }
      person.friendRequests.received.push(user._id);
      return person.save();
    })
    .then(() => {
      if (user.friendRequests.sent.indexOf(user._id) > 1) {
        throw new Error('friend request already sent');
      }
      user.friendRequests.sent.push(friendId);
      return user.save();
    })
    .then(() => {
      console.log('added Friend', user._id, friendId);
      socket.emit('addFriend', friendId);
    })
    .catch((err) => {
      console.log(err);
    });
  });
  // Accept Friend Request
  socket.on('confirmFriend', (friendId) => {
    console.log('confirmFriend', friendId);
    if (user._id.equals(friendId)) {
      return;
    }
    User.findOne({ '_id': friendId })
    .then((person) => {
      person.friendRequests.sent = person.friendRequests.sent.filter((req) => {
        return !user._id.equals(req);
      });
      person.friends.push(user._id);
      console.log(person);
      return person.save();
    })
    .then(() => {
      user.friendRequests.received = user.friendRequests.received.filter((req) => {
        return !req.equals(friendId);
      });
      user.friends.push(friendId);
      console.log(user);
      return user.save();
    })
    .then(() => {
      console.log('added Friend', user._id, friendId);
      socket.emit('confirmFriend', friendId);
    })
    .catch((err) => {
      console.log(err);
    });
  });
  socket.on('removeFriend', (friendId) => {
    console.log('removeFriend', friendId);
    if (user._id.equals(friendId)) {
      return;
    }
    User.findOne({ '_id': friendId })
    .then((person) => {
      person.friends = person.friends.filter((f) => {
        return !user._id.equals(f);
      });
      return person.save();
    })
    .then(() => {
      user.friends = user.friends.filter((f) => {
        return !f.equals(friendId);
      });
      return user.save();
    })
    .then(() => {
      console.log('removed Friend', user._id, friendId);
      socket.emit('removeFriend', friendId);
    })
    .catch((err) => {
      console.log(err);
    });
  });
  // reset friend requests
  // User.find({}).then((users) => {
  //   users.map((u) => {
  //     u.friendRequests.sent = [];
  //     u.friendRequests.received = [];
  //     u.save();
  //   });
  // })
};
