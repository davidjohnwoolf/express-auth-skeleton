'use strict';

var express = require('express');
var router = express.Router();

// get home page
router.get('/', function(req, res) {
  res.render('index', { title: 'Express Auth Skeleton' });
});

module.exports = router;
