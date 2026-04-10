const express = require('express');
const { analyzeTriage } = require('../controllers/triageController');

const router = express.Router();

router.post('/analyze', analyzeTriage);

module.exports = router;
