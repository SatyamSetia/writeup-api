const Sequelize = require('sequelize');
const DT = Sequelize.DataTypes;

const UserModel = {
  user_id: {
    type: DT.UUID,
    primaryKey: true,
    defaultValue: DT.UUIDV1
  },
  username: DT.STRING(45),
	password: DT.STRING(45)
}

const UserDetailModel = {
  user_id: DT.UUID,
	email: DT.STRING(45),
  bio: DT.STRING(200),
  image: DT.STRING(200)
}

module.exports = {
  UserModel,
  UserDetailModel
}
