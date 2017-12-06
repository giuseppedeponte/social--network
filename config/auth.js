'use strict';
const isOwner = (user, ownerId) => {
  return (user && user._id.equals(ownerId));
};
const isFriend = (user, ownerId) => {
  return user && user.hasFriend(ownerId);
};
const isAdmin = (user) => {
  return user && user.role === 'admin';
}
const updateReq = (req) => {
  req.isOwner = isOwner(req.user, req.params.userId);
  req.isFriend = isFriend(req.user, req.params.userId);
  req.isAdmin = isAdmin(req.user);
  return;
};
const loggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('loginMessage', 'Vous devez vous connecter pour acceder à cette page');
  res.redirect('/user/login');
};
module.exports.loggedIn = loggedIn;
module.exports.owner = (req, res, next) => {
  loggedIn(req, res, () => {
    updateReq(req);
    if(req.isAdmin || req.isOwner) {
      return next();
    }
    req.flash('flashMessage', 'Vous n\'avez pas le droit d\'accèder à cette page');
    res.redirect('/');
  });
};
module.exports.friend = (req, res, next) => {
  loggedIn(req, res, () => {
    updateReq(req);
    if (req.isAdmin || req.isFriend || req.isOwner) {
      return next();
    }
    req.flash('flashMessage', 'Vous n\'avez pas le droit d\'accèder à cette page');
    res.redirect('/');
  });
};
module.exports.admin = (req, res, next) => {
  loggedIn(req, res, () => {
    updateReq(req);
    if (req.isAdmin) {
      return next();
    }
    req.flash('flashMessage', 'Vous n\'avez pas le droit d\'accèder à cette page');
    res.redirect('/');
  });
};
