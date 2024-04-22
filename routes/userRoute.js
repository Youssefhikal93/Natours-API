const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
// const reviewController = require("../controllers/reviewController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// this middleware to protect all the code below
//to protect all routes
router.use(authController.protect);
//--------------------------------------------

router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword,
);

router.get("/me", userController.getMe, userController.getUser);

router.patch(
  "/updateMe",
  authController.protect,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.delete("/deleteMe", authController.protect, userController.deleteMe);

// to restrict all routes below
router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
