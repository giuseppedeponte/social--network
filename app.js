'use strict';
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sassMiddleware = require('node-sass-middleware');
const User = require('./models/User');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');

const configDB = require('./config/database');
const DBConnection = mongoose.connect(configDB.url, configDB.options)
.then((db) => {
  console.log('Database connected');
  User.updateMany({}, { $set: { socket: '' }}, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('resetting user socket', result);
    }
  });
})
.catch((err) => {
  console.log('Unable to connect to Database');
});

require('./config/passport')(passport);

const index = require('./routes/index');
const user = require('./routes/user');
const blog = require('./routes/blog');
const inbox = require('./routes/inbox');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  debug: process.env.NODE_ENV !== 'production',
  indentedSyntax: false,
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'secretsecretivegotasecret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req, res, next) {
  res.io = io;
  next();
});

app.use('/', index);
app.use('/user', user);
app.use('/blog', blog);
app.use('/inbox', inbox);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = {
  app: app,
  server: server
};
