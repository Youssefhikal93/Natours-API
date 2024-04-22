const express = require("express");
const viewsController = require("../controllers/viewsController");
const bookingController = require("../controllers/bookingController");

const router = express.Router();

router.get(
  "/",
  bookingController.creatBookingCheckout,
  viewsController.getOverview,
);
router.get("/tour/:slug", viewsController.getTour);

// login
router.get("/login", viewsController.getLoginForm);

module.exports = router;
