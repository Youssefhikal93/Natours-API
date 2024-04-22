const express = require("express");
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route("/")
  .get(reviewController.getAllReview)
  .post(
    authController.restrictTo("user"),
    reviewController.setTouruserIds,
    reviewController.createReview,
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.updatereview,
  )
  .delete(
    authController.restrictTo("user", "admin"),
    reviewController.deleteReview,
  );

module.exports = router;
