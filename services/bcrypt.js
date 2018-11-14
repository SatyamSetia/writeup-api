const bcrypt = require('bcryptjs');

function encryptPassword(password) {
  return bcrypt.hashSync(password, 8);
}

module.exports = {
  encryptPassword
}
