const Sequelize = require('sequelize');
const DT = Sequelize.DataTypes;

const UserModel = {
  user_id: {
    type: DT.UUID,
    primaryKey: true,
    defaultValue: DT.UUIDV1
  },
  username: {
    type: DT.STRING(45),
    unique: true,
    allowNull: false
  },
	password: {
    type: DT.STRING(45),
    allowNull: false
  }
}

const UserDetailModel = {
  user_id: DT.UUID,
	email: {
    type: DT.STRING(45),
    unique: true,
    allowNull: false
  },
  bio: DT.STRING(200),
  image: DT.STRING(200)
}

module.exports = {
  UserModel,
  UserDetailModel
}
