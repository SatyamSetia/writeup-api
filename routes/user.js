const route = require('express').Router();

const { User, UserDetails }  = require('../db/index');
const { encryptPassword }  = require('../services/bcrypt');
const { generateToken } = require('../services/jwt');
const { generateUUID } = require('../services/uuidService');
const  { validateUsername, validatePassword, validateEmail } = require('../middlewares');

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

route.post('/login', async (req, res) => {
  res.send(200)
})

module.exports = route;
