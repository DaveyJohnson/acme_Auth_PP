const Sequelize = require('sequelize');
const JWT = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const process_env_JWT = 'somekeyhere';

const saltRounds = 10;

const { STRING } = Sequelize;
const config = {
  logging: false
};

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

User.beforeCreate(async (user) => {
  const hash = await bcrypt.hash(user.password, saltRounds);
  // Store hash in your password DB.
  user.password = hash;
})

User.byToken = async(token)=> {
  try {
   const newToken = JWT.verify(token, process_env_JWT)
   const { userId } = newToken

    const user = await User.findByPk(userId);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;;
    throw error;
  }
};


console.log('This the environment ------>', process.env.JWT)


User.authenticate = async({ username, password }) => {

  let tempHashPassword = await bcrypt.hash(password, saltRounds)
  const hashMatch = await bcrypt.compare(password, tempHashPassword)

  console.log("authenticate Password===>", password);
  console.log("authenticate hashPassword===>", hashPassword);

  if (hashMatch) {

  }

  const user = await User.findOne({
    where: {
      username,
      password: tempHashPassword
    }
  });
  if(user){
    const token = JWT.sign({ userId: user.id }, process_env_JWT);
    console.log('This is the token in the auth method -------->>>>>>>>', token)
    return token
  }

  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User
  }
};
