const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { success, error } = require('consola');
const passport = require('passport');
const config = require('./Phone-Verification/config');

// configure twilio
const client = require('twilio')(config.accountSID, config.authToken);

// @configure database connection
const connectDB = require('./config/db');

// user defined routers
const userRouter = require('./routes/users.route');

// instantiate express app
const app = express();

// configure the directory
// config the directory
dotenv.config({ path: './config/.env' });

// connect to database
connectDB();

app.use(passport.initialize());
require('./middleware/passport')(passport);
app.use(cors()); // to enable cross origin resource sharing
app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use('/user', userRouter);

// configure the verification route
app.post('/login', (req, res) => {
  client.verify
    .services(config.serviceID)
    .verifications.create({
      to: `+${req.body.phoneNo}`,
      channel: req.body.channel,
    })
    .then((data) => {
      return res.status(200).json(data);
    })
    .catch((error) => console.log(error));
});

app.post('/verify', (req, res) => {
  client.verify
    .services(config.serviceID)
    .verificationChecks.create({
      to: `+${req.body.phoneNo}`,
      code: req.body.code,
    })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(500).json({ message: 'unable to verify' }));
});

// configure the port
const PORT = process.env.PORT;
app.listen(PORT, () => {
  success({ message: `Server Started on port ${PORT}`, badge: true });
});
