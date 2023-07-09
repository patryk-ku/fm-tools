const express = require("express");
const router = express.Router();
const topArtistsController = require('../controllers/topArtistController')

router.get('/:userId/:amount?', topArtistsController.getTopArtists);

// router.get('/:userId/:amount', topArtistsController.getTopArtistsByAmount);

module.exports = router;
