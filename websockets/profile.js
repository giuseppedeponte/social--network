const querystring = require('querystring');
const emailer = require('../config/email');
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
        if (!us._id.equals(user._id)) {
          emailer.send({
            to: us.email,
            subject: 'Nouveau message | Social Network',
            text: 'Un nouveau message a été publié sur votre profil. '
          });
        }
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
    let filter = {
      $or: [
        { name: query.friendSearch },
        { email: query.friendSearch },
        { 'info.firstName': query.friendSearch },
        { 'info.lastName': query.friendSearch }
      ]
    };
    User
    .find(filter)
    .select({
      name: 1,
      _id: 1,
      socket: 1,
      email: 1,
      role: 1,
      'profile.image': 1
    })
    .then((result) => {
      users = [];
      result.map((person) => {
        if (!user._id.equals(person._id)) {
          let online = typeof io.sockets.connected[person.socket] !== 'undefined';
          let relation = '';
          if (user.role === 'admin') {
            relation = 'admin';
          } else if(user.friends.indexOf(person._id) >= 0) {
            relation = 'friend';
          } else if (user.friendRequests.sent.indexOf(person._id) >= 0) {
            relation = 'requestSent';
          } else if (user.friendRequests.received.indexOf(person._id) >= 0) {
            relation = 'requestReceived';
          }
          let u = {
            name: person.name,
            email: person.email,
            _id: person._id,
            socket: person.socket,
            online: online,
            role: person.role,
            image: person.profile.image,
            relation: relation
          };
          users.push(u);
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
      emailer.send({
        to: person.email,
        subject: 'Demande de connexion reçue | Social Network',
        text: 'Un utilisateur vous a invité a rejoindre son cercle d\'amis. Vous pouvez accepter ou refuser son invitation sur votre profil.'
      });
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
  // Refuse Friend Request
  socket.on('refuseFriend', (friendId) => {
    console.log('refuseFriend', friendId);
    if (user._id.equals(friendId)) {
      return;
    }
    User.findOne({ '_id': friendId })
    .then((person) => {
      person.friendRequests.sent = person.friendRequests.sent.filter((req) => {
        return !user._id.equals(req);
      });
      return person.save();
    })
    .then(() => {
      user.friendRequests.received = user.friendRequests.received.filter((req) => {
        return !req.equals(friendId);
      });
      return user.save();
    })
    .then(() => {
      console.log('friend request refused', user._id, friendId);
      socket.emit('refuseFriend', friendId);
    })
    .catch((err) => {
      console.log(err);
    });
  });
  socket.on('removeFriend', (friendId, userId) => {
    userId = userId && user.role === 'admin' ? userId : user._id;
    console.log('removeFriend', userId, friendId);
    if (userId === friendId) {
      return;
    }
    User.findOne({ '_id': friendId })
    .then((person) => {
      person.friends = person.friends.filter((f) => {
        return !f.equals(userId);
      });
      return person.save();
    })
    .then(() => {
      return User.findOne({ '_id': userId })
      .then((usr) => {
        usr.friends = usr.friends.filter((f) => {
          return !f.equals(friendId);
        });
        return usr.save();
      });
    })
    .then(() => {
      console.log('removed Friend', userId, friendId);
      socket.emit('removeFriend', friendId);
    })
    .catch((err) => {
      console.log(err);
    });
  });
  socket.on('shareFriend', (friendA, friendB, userId) => {
    if (user.role === 'admin' || user._id.equals(userId)) {
      User.findOne({ '_id': friendA })
      .then((a) => {
        let newRequest = true;
        a.friends.map((friend) => {
          if (friend.equals(friendB)) {
            newRequest = false;
          }
        });
        a.friendRequests.sent.map((request) => {
          if (request.equals(friendB)) {
            newRequest = false;
          }
        });
        a.friendRequests.received.map((request) => {
          if (request.equals(friendB)) {
            newRequest = false;
          }
        });
        if (newRequest) {
          a.friendRequests.sent.push(friendB);
          emailer.send({
            to: a.email,
            subject: 'Recommandation | Social Network',
            text: 'Vous avez reçu une nouvelle recommandation pour votre liste d\'amis.'
          });
          return a.save();
        } else {
          throw new Error('Already shared or friend');
        }
      })
      .then(() => {
        return User.findOne({ '_id': friendB });
      })
      .then((b) => {
        b.friendRequests.received.push(friendA);
        emailer.send({
          to: b.email,
          subject: 'Recommandation | Social Network',
          text: 'Vous avez reçu une nouvelle recommandation pour votre liste d\'amis.'
        });
        return b.save();
      })
      .then(() => {
        socket.emit('shareFriend');
      })
      .catch((e) => {
        console.log(e.message);
      })
    }
  });
  // reset friend requests
  // User.find({}).then((users) => {
  //   users.map((u) => {
  //     u.friendRequests.sent = [];
  //     u.friendRequests.received = [];
  //     u.friendRequests.shared = [];
  //     u.save();
  //   });
  // })

  // CHAT
  socket.on('outgoingCall', (call) => {
    User.findOne({'_id': call.callee})
    .then((u) => {
      if (u.socket) {
        call.callee = u;
        call.caller = user;
        io.to(u.socket).emit('incomingCall', call);
      }
    })
    .catch((e) => {
      socket.emit('hangUp');
    })
  });
  socket.on('callAccepted', (call) => {

  });
  socket.on('callRefused', (call) => {
    console.log('callRefused');
    User.findOne({'_id': call.caller})
    .then((u) => {
      if (u.socket) {
        io.to(u.socket).emit('callRefused', call);
      }
    })
    .catch((e) => {
      socket.emit('hangUp');
    });
  });
  socket.on('incomingMessage', (message) => {

  });
  socket.on('hangUp', (call) => {
    io.to(call.caller.socket).emit('hangUp');
    io.to(call.callee.socket).emit('hangUp');
  });
};
