const router = require('express').Router();
const {
  registerUser,
  loginUser,
  userAuth,
  serializeUser,
  checkRole,
} = require('../utils/Auth');

//@consumer registration route
router.post('/register_consumer', async (req, res) => {
  await registerUser(req.body, 'Consumer', res);
});

//@farmer registration route
router.post('/register_farmer', async (req, res) => {
  await registerUser(req.body, 'Farmer', res);
});
//@admin registration route
router.post('/register_admin', async (req, res) => {
  await registerUser(req.body, 'Admin', res);
});
//@consumer authentication route
router.post('/log_consumer', async (req, res) => {
  await loginUser(req.body, 'Consumer', res);
});
//@farmer authentication route
router.post('/log_farmer', async (req, res) => {
  await loginUser(req.body, 'Farmer', res);
});
//@admin authentication route
router.post('/log_admin', async (req, res) => {
  await loginUser(req.body, 'Admin', res);
});
//@consumer Protected route
router.get(
  '/consumer_profile',
  userAuth,
  checkRole(['Consumer']),
  async (req, res) => {
    return res.json(serializeUser(req.user));
  }
);
//@farmer Protected route
router.get(
  '/farmer_profile',
  userAuth,
  checkRole(['Farmer']),
  async (req, res) => {
    return res.json(serializeUser(req.user));
  }
);
//@admin Protected route
router.get(
  '/admin_profile',
  userAuth,
  checkRole(['Admin']),
  async (req, res) => {
    return res.json(serializeUser(req.user));
  }
);
module.exports = router;
