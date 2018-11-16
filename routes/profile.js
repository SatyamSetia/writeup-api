const route = require('express').Router();

const { User, UserDetails }  = require('../db/index');
const { getIdFromToken } = require('../services/jwt');

route.get('/:username', (req, res) => {
  res.status(200).json({
    username: req.params.username
  });
})

route.post('/:username/follow', async (req, res) => {

  if(req.headers.token) {
    let user_id;

    const decryptedToken = getIdFromToken(req.headers.token);

    if(decryptedToken.error) {
      return res.status(401).json({
        errors: {
          message: ["Invalid Token"]
        }
      })
    } else {
      user_id = decryptedToken.id;
    }

    try {
      const followerUser = await User.findByPrimary(user_id);

      const followingUserDetails = await UserDetails.findOne({
        where: {
          username: req.params.username
        }
      });

      const followingUser = await User.findByPrimary(followingUserDetails.user_id);

      followingUser.addFollower(followerUser);

      return res.status(200).json({
        profile: {
          username: followingUserDetails.username,
          bio: followingUserDetails.bio,
          image: followingUserDetails.image,
          following: true
        }
      })
    } catch(err) {
      return res.status(500).json({
        errors: {
          message: ["Something went wrong"]
        }
      })
    }

  } else {
    return res.status(401).json({
      errors: {
        message: ["Unauthorized access not allowed. Token required"]
      }
    })
  }
})

module.exports = route;
