const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const { User, UserDetails } = require('./db/index');
const { isPasswordValid } = require('./services/bcrypt');

passport.serializeUser(function(user,done){
	done(null,user.user_id)
});

passport.deserializeUser(function(userKey,done){
	User.findByPrimary(userKey).then((user)=>{
		done(null,user)
	}).catch((err)=>{
		done(err)
	})
});

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
		UserDetails.findOne({
			where: {
				email: email
			}
		}).then(userDetails => {
			if(!userDetails) {
				return done(null, false, {
          message: 'User does not exists.'
        });
			}

			User.findByPrimary(userDetails.user_id).then(user => {
				if(!isPasswordValid(password, user.dataValues.password)) {
	        return done(null, false, {
	          message: 'Incorrect password'
	        })
	      }

				return done(null,user);
			})
		}).catch((err)=>{
      console.log(err)
  		done(err)
  	})
  }
));

module.exports = passport;
