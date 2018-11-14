const validateUsername = (req, res, next) => {
  if(!req.body.username || req.body.username.length == 0 ) {
    return res.status(400).json({
      errors: {
        username: ["Username must have single character"]
      }
    })
  }
  next();
}

const validatePassword = (req, res, next) => {
  if(!req.body.password || req.body.password.length < 6 ) {
    return res.status(400).json({
      errors: {
        password: ["Password is too short"]
      }
    })
  }
  next();
}

const validateEmail = (req, res, next) => {
  if(!req.body.email ) {
    return res.status(400).json({
      errors: {
        email: ["Email can not be empty"]
      }
    })
  }
  next();
}

module.exports = {
  validateUsername,
  validatePassword,
  validateEmail
}
