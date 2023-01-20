import mongoose from 'mongoose';
mongoose.set('strictQuery', false);

(async () => {
  if (!process.env.DB_URL || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    throw Error('Missing env variables for DB');
  }

  const mongooseConnectionUrl = process.env.DB_URL?.replace(
    '<DB_USER>',
    process.env.DB_USER
  ).replace('<DB_PASSWORD>', process.env.DB_PASSWORD);

  console.log('Trying to connect to DB here: ', mongooseConnectionUrl);

  await mongoose.connect(mongooseConnectionUrl);

  console.log('Connected to DB here:', mongooseConnectionUrl);
})();
