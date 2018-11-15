const validateUsername = (req, res, next) => {
  if(req.headers.token) {
    if(req.body.username != undefined) {
      if(req.body.username.length == 0) {
        return res.status(400).json({
          errors: {
            username: ["Username must have single character"]
          }
        })
      }
    }
  } else {
    if(!req.body.username) {
      return res.status(400).json({
        errors: {
          username: ["Username is required"]
        }
      })
    } else if(req.body.username.length < 4) {
      return res.status(400).json({
        errors: {
          username: ["Username must have 4 characters"]
        }
      })
    }
  }
  next();
}

const validatePassword = (req, res, next) => {
  if(req.headers.token) {
    if(req.body.password != undefined && req.body.password.length < 6) {
      return res.status(400).json({
        errors: {
          password: ["Password is too short"]
        }
      })
    }
  }
  else {
    if(req.body.password == undefined) {
      return res.status(400).json({
        errors: {
          password: ["Password is required"]
        }
      })
    } else if(req.body.password.length < 6) {
      return res.status(400).json({
        errors: {
          password: ["Password is too short"]
        }
      })
    }
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
