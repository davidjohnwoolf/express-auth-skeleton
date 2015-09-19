'use strict';

var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var User = require('../models/user');

// router middleware
router.use(bodyParser.urlencoded({ extended: false }));
router.use(methodOverride(function(req, res) {
  // check for _method property in form requests
  // see hidden input field in views
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// require user session
function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('alert', 'You need to log in to continue');
    res.redirect('/users/login');
  } else {
    next();
  }
}

// require specific user session
function requireUser(req, res, next) {
  if (req.session.user !== req.params.id) {
    req.flash('alert', 'You are unauthorized to make that request');
    res.redirect('back');
  } else {
    next();
  }
}

// render login form
router.get('/login', function(req, res) {
  res.render('users/login', { title: 'Login' });
});

// login/create session
router.post('/login', function(req, res) {
  // check to see if user exists
  User.findOne({ username: req.body.username }, function(err, user) {
    if (err) {
      return res.send(err);
    }

    if (user === null) {
      // if user does not exist
      req.flash('alert', 'Incorrect username/password');
      res.redirect('/users/login');
    } else {
      // check to see if passwords match (method found in user model)
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (err) {
          return res.send(err);
        }

        if (isMatch) {
          req.session.user = user._id;
          req.flash('notice', 'Successfully logged in');
          res.redirect('/');
        }

        if (!isMatch) {
          req.flash('alert', 'Incorrect username/password');
          res.redirect('/users/login');
        }
      });
    }
  });
});

// logout/destroy session
router.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    if (err) {
      return res.send(err);
    }

    res.redirect('/');
  });
});

// users index
router.get('/', requireLogin, function(req, res) {
  User.find(function(err, users) {
    if (err) {
      return res.send(err);
    }

    res.render('users/index', { title: 'Users', 'users': users});
  });
});

// render new user page
router.get('/new', function(req, res) {
  res.render('users/new', { title: 'Create User' });
});

// create user
router.post('/new', function(req, res) {
  // check if username is taken
  User.findOne({ username: req.body.username }, function(err, user) {
    if (err) {
      return res.send(err);
    }

    if (user !== null) {
      // if username taken
      req.flash('alert', 'Username not available');
      res.redirect('/users/new');
    } else {
      createUser();
    }
  });

  function createUser() {
    if (req.body.password !== req.body.confirmation) {
      // if password and password confirmation don't match
      req.flash('alert', 'Passwords must match');
      res.redirect('/users/new');
    } else {
      var user = new User({
        username: req.body.username,
        password: req.body.password
      });

      user.save(function(err) {
        if (err) {
          return res.send(err);
        }

        req.flash('notice', 'Successfully created user');
        res.redirect('/');
      });
    }
  }
});

// show user
router.get('/:id', requireLogin, function(req, res) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return res.send(err);
    }

    res.render('users/show', { title: 'User ' + user.id, 'user': user});
  });
});

// render edit user page
router.get('/:id/edit', requireUser, function(req, res) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return res.send(err);
    }

    res.render('users/edit', { title: 'Edit User ' + user.id, 'user': user});
  });
});

// update user
router.put('/:id/edit', requireUser, function(req, res) {
  // check if username is taken
  User.findOne({ username: req.body.username }, function(err, user) {
    if (err) {
      return res.send(err);
    }

    if (user !== null) {
      // if username is taken
      req.flash('alert', 'Username not available');
      res.redirect('back');
    } else {
      updateUser();
    }
  });

  function updateUser() {
    User.findById(req.params.id, function(err, user) {
      if (err) {
        return res.send(err);
      }

      if (req.body.password !== req.body.confirmation) {
        req.flash('alert', 'Passwords must match');
        res.redirect('/users/' + user._id + '/edit');
      } else {
        if (req.body.password === '') {
          delete req.body.password;
        }

        for (var key in req.body) {
          user[key] = req.body[key];
        }

        user.save(function(err) {
          if (err) {
            return res.send(err);
          }

          req.flash('notice', 'Successfully updated user');
          res.redirect('/users/' + user._id);
        });
      }
    });
  }
});

// destroy
router.delete('/:id', requireUser, function(req, res) {
  User.remove({ _id: req.params.id }, function(err, user) {
    if (err) {
      return res.send(err);
    }

    // delete user session after deleting user account
    // might be a better option (deleting with session.destroy removed flash)
    delete req.session.user;
    req.flash('notice', 'Successfully deleted user');
    res.redirect('/');
  });
});

module.exports = router;
