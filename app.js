'use strict';

var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var flash = require('connect-flash');
var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// configuration
app.disable('x-powered-by'); // remove stack info from headers
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 1337);

// database
mongoose.connect('mongodb://localhost/expressAuthSkeleton');

// middleware
app.use(logger('dev'));
app.use(cookieParser());
app.use(session({
  // to use secure cookies use https and update code
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());
app.use(function(req, res, next) {
  // set session and flash info to locals
  res.locals.session = req.session;
  res.locals.flashNotice = req.flash('notice');
  res.locals.flashAlert = req.flash('alert');
  next();
});
app.use(express.static('public'));

app.use('/', routes);
app.use('/users', users);

// error handling (taken from express generator)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Page Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// server
app.listen(app.get('port'));
console.log('Listening...');
