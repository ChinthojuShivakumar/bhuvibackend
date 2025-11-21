// src/routes/channelPartnerRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const channelPartnerController = require('../controllers/channelPartnerController')
// const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const upload = multer();

router.use(authMiddleware.addUserToRequest);

router.post('/add-user', channelPartnerController.addUser);
router.post('/add-channel-partner', channelPartnerController.addChannelPartner);

router.get('/dashboard-numbers', channelPartnerController.getDashboardNumbers);
router.get('/dashboard-data', channelPartnerController.getDashboardData);
router.get('/cp-tree', channelPartnerController.getChannelPartnerTree);
router.get('/cp-tree/:channel_partner_id', channelPartnerController.getChannelPartnerTree);

// router.get('/dashboard');

module.exports = router;