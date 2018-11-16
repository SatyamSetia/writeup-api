const Sequelize = require('sequelize');
const {
  UserModel,
  UserDetailModel
} = require('./models');

const db = new Sequelize({
  dialect: 'sqlite',
  storage: __dirname + 'store.db'
})

const User = db.define('user', UserModel);
const UserDetails = db.define('userDetail', UserDetailModel);

UserDetails.belongsTo(User,{foreignKey: 'user_id'});
User.hasOne(UserDetails,{foreignKey: 'user_id'});

User.belongsToMany(User, {as: 'follower',foreignKey: 'followingId',through: 'connection'})
User.belongsToMany(User, {as: 'following',foreignKey: 'followerId',through: 'connection'})

db.sync()

module.exports = {
  db,
  User,
  UserDetails
}
