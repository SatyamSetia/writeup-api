const Sequelize = require('sequelize');
const {
  UserModel,
  UserDetailModel,
  ArticleModel,
  TagModel
} = require('./models');

const db = new Sequelize({
  dialect: 'sqlite',
  storage: __dirname + '/store.db'
})

const User = db.define('user', UserModel);
const UserDetails = db.define('userDetail', UserDetailModel);
const Article = db.define('article', ArticleModel);
const Tags = db.define('tag',TagModel);

User.belongsTo(UserDetails,{foreignKey: 'user_id'});
UserDetails.hasOne(User,{foreignKey: 'user_id'});

UserDetails.belongsToMany(UserDetails, {as: 'follower',foreignKey: 'followingId',through: 'UserConnection'})
UserDetails.belongsToMany(UserDetails, {as: 'following',foreignKey: 'followerId',through: 'UserConnection'})

Article.belongsToMany(Tags, {foreignKey: 'article_id', through: 'ArticleTag'})
Tags.belongsToMany(Article, {foreignKey: 'tagName', through: 'ArticleTag'})

UserDetails.hasMany(Article, {foreignKey: 'user_id'})
Article.belongsTo(UserDetails, {as: 'author', foreignKey: 'user_id'})

Article.belongsToMany(UserDetails, {as:'favoritedBy', foreignKey: 'article_id', through: 'Favorite'})
UserDetails.belongsToMany(Article, {as:'favoritedArticles', foreignKey: 'user_id', through: 'Favorite'})

db.sync()

module.exports = {
  db,
  User,
  UserDetails,
  Article,
  Tags
}
