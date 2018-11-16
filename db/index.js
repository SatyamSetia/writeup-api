const Sequelize = require('sequelize');
const {
  UserModel,
  UserDetailModel,
  ArticleModel
} = require('./models');

const db = new Sequelize({
  dialect: 'sqlite',
  storage: __dirname + 'store.db'
})

const User = db.define('user', UserModel);
const UserDetails = db.define('userDetail', UserDetailModel);
const Article = db.define('article', ArticleModel);

User.belongsTo(UserDetails,{foreignKey: 'user_id'});
UserDetails.hasOne(User,{foreignKey: 'user_id'});

UserDetails.belongsToMany(UserDetails, {as: 'follower',foreignKey: 'followingId',through: 'connection'})
UserDetails.belongsToMany(UserDetails, {as: 'following',foreignKey: 'followerId',through: 'connection'})

db.sync()

module.exports = {
  db,
  User,
  UserDetails,
  Article
}
