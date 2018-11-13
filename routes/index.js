const route = require('express').Router();
const db = require('../db/index').db;

route.get('/',(req,res) => {
  res.send('Hello World');
})

module.exports = route
