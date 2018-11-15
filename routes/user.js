const route = require('express').Router();

const { User, UserDetails }  = require('../db/index');
const { encryptPassword }  = require('../services/bcrypt');
const { generateToken, getIdFromToken } = require('../services/jwt');
const { generateUUID } = require('../services/uuidService');
const  { validateUsername, validatePassword, validateEmail } = require('../middlewares');
const passport = require('../auth');

route.post('/users', validateUsername, validatePassword, validateEmail , async (req, res) => {

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

route.post('/users/login',
  passport.authenticate('local', {
    successRedirect: '../user',
    failureRedirect: '../error',
    failureFlash: true
  })
);

route.get('/user', (req, res) => {

  let user_id, email;

  if(!req.headers.token) {

    user_id = req.user.dataValues.user_id;
    email = req.user.dataValues.email

  } else {
    const decryptedToken = getIdFromToken(req.headers.token);
    if(decryptedToken.error) {
      return res.status(401).json({
        errors: {
          message: ["Invalid Token"]
        }
      })
    } else {
      user_id = decryptedToken.id;

      try {
        User.findByPrimary(user_id).then(user => {
          email = user.email
        })
      } catch(err) {
        return res.status(500).json({
          errors: {
            message: ["Something went wrong"]
          }
        })
      }
    }
  }

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

route.put('/user', validateUsername, validatePassword, async (req, res) => {

  const decryptedToken = getIdFromToken(req.headers.token);
  if(decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: ["Invalid Token"]
      }
    })
  } else {
    const user = await User.findByPrimary(decryptedToken.id);
    console.log
    const userDetail = await UserDetails.findOne({
      where: {
        user_id: user.user_id
      }
    })

    if(req.body.email) {
      user.email = req.body.email
    }
    if(req.body.password) {
      user.password = encryptPassword(req.body.password)
    }
    if(req.body.username) {
      userDetail.username = req.body.username
    }
    if(req.body.bio) {
      userDetail.bio = req.body.bio
    }
    if(req.body.image) {
      userDetail.image = req.body.image
    }

    try {
      const updatedUser = await user.save();
      const updatedUserDetails = await userDetail.save();

      return res.status(200).json({
        user: {
          email: updatedUser.email,
          token: req.headers.token,
          username: updatedUserDetails.username,
          bio: updatedUserDetails.bio,
          image: updatedUserDetails.image
        }
      })
    } catch(err) {
      res.status(500).json({
        errors: {
          message: err.message
        }
      })
    }
  }
})

module.exports = route;
