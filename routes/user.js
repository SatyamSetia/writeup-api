const route = require('express').Router();

const { User, UserDetails }  = require('../db/index');
const { encryptPassword }  = require('../services/bcrypt');
const { generateToken } = require('../services/jwt');
const { generateUUID } = require('../services/uuidService');
const  { validateUsername, validatePassword, validateEmail } = require('../middlewares');
const passport = require('../auth');

route.post('/', validateUsername, validatePassword, validateEmail , async (req, res) => {

  const userId = await generateUUID();
  const hashedPassword = encryptPassword(req.body.password);

  try {
    const newUser = await User.create({
      email: req.body.email,
      password: hashedPassword,
      user_id: userId,
    })

    const newUserDetails = await UserDetails.create({
      user_id: userId,
      username: req.body.username
    })

    const token = generateToken(userId);

    res.status(201).json({
      user: {
        token: token,
        email: newUser.email,
        username: newUserDetails.username,
        bio: null,
        image: null
      }
    })
  } catch(err) {
    res.status(500).json({
      errors: {
        message: ["Something went wrong"]
      }
    })
  }

})

route.post('/login',
  passport.authenticate('local', {
    successRedirect: '/api/users/profile',
    failureRedirect: '/api/users/error',
    failureFlash: true
  })
);

route.get('/profile', (req, res) => {

  const { user_id, email } = req.user.dataValues;

  try {
    UserDetails.findOne({
      where: {
        user_id: user_id
      }
    }).then( (userDetail) => {

      const token = generateToken(user_id);

      res.status(200).json({
        user: {
          email,
          token,
          username: userDetail.username,
          bio: userDetail.bio,
          image: userDetail.image
        }
      })
    })
  } catch(err) {
    res.status(500).json({
      errors: {
        message: ["Something went wrong"]
      }
    })
  }
})

route.get('/error', (req, res) => {
  res.status(422).json({
    errors: req.flash().error
  });
})

module.exports = route;
