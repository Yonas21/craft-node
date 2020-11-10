const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { session } = require('passport');
/**
 @ Register Consumers, farmers and Admins
based on Their Roles

*/

const registerUser = async (userData, role, res) => {
  try {
    // validate phoneNumber
    let phoneNumberNotTaken = await validatePhoneNumber(userData.phoneNo);
    if (phoneNumberNotTaken) {
      return res.status(400).json({
        message: 'Phone Number Already Used.',
        success: false,
      });
    }

    let emailNotTaken = await validateEmail(userData.email);
    if (emailNotTaken) {
      return res.status(400).json({
        message: 'Email Already Used.',
        success: false,
      });
    }

    // Get the password hashed
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const newUser = new User({
      ...userData,
      password: hashedPassword,
      role,
    });
    await newUser.save();
    return res.status(201).json({
      message: 'You have successfully signed up !!',
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'unable to create an account',
      success: false,
      err: err,
    });
  }
};

// @check if the email and phone number
const loginUser = async (userData, role, res) => {
  let { phoneNo, password } = userData;

  // check if phone Number is in the database
  let user = await User.findOne({ phoneNo });
  if (!user) {
    return res.status(404).json({
      message: 'PhoneNo no found, invalid login credentials',
      success: false,
    });
  }

  if (user.role != role) {
    return res.status(404).json({
      message:
        'unAuthorized user, please make sure You logged in from the right portal',
      success: false,
    });
  }

  // check for the password
  let passwordMatch = await bcrypt.compare(password, user.password);
  if (passwordMatch) {
    let token = jwt.sign(
      {
        user_id: user._id,
        role: user.role,
        email: user.email,
        phoneNo: user.phoneNo,
      },
      process.env.JWT_SECRET,
      { expiresIn: '3 days' }
    );

    let result = {
      email: user.email,
      phoneNo: user.phoneNo,
      role: user.role,
      token: `Bearer ${token}`,
      expiresIn: 168,
    };

    return res.status(200).json({
      ...result,
      message: 'You are Logged In',
      success: true,
    });
  } else {
    return res.status(403).json({
      message: 'incorrect password',
      success: false,
    });
  }
};
// @check if phone number is already there
const validatePhoneNumber = async (phoneNo) => {
  let user = await User.findOne({ phoneNo });
  return user ? true : false;
};
// @check if email is already there
const validateEmail = async (email) => {
  let user = await User.findOne({ email });
  return user ? true : false;
};

/**
 *
 * @ Check the users Role
 */

const checkRole = (roles) => (req, res, next) => {
  roles.includes(req.user.role)
    ? next()
    : res.status(401).json({
        message: 'unAuthorized',
        success: false,
      });
};

/**
 * @ hide the password from being exposed
 */
const serializeUser = (user) => {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phoneNo: user.phoneNo,
    createdAt: user.createdAt,
    updated: user.updatedAt,
  };
};

/**
 * @ Passport Middleware
 */

const userAuth = passport.authenticate('jwt', { session: false });
module.exports = {
  userAuth,
  checkRole,
  registerUser,
  loginUser,
  serializeUser,
};
