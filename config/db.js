const mongoose = require('mongoose');
const { success, error } = require('consola');

// connect to mongoDB database
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
    });

    success({
      message: `Connected to ${process.env.MONGO_URL}`,
      badge: true,
    });
  } catch (error) {
    error({ message: `Error: ${error.message}` });
    process.exit(1);
  }
};

module.exports = connectDB;
