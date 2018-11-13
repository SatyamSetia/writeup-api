const route = require('express').Router();
const { User, UserDetails }  = require('../db/index');

route.post('/', async (req, res) => {
  try {
    const newUser = await User.create({
      username: req.body.username,
      password: req.body.password,
      user_id: req.body.user_id
    })

    const newUserDetails = await UserDetails.create({
      user_id: newUser.user_id,
      email: req.body.email,
      bio: req.body.bio,
      image: req.body.image
    })
  } catch(err) {
    res.send(500).json({
      message: 'LOL.. Internal Server Error'
    })
  }

  res.status(201).json({
    message: 'User registered'
  })
})

module.exports = route;
