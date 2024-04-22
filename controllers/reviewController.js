const Review = require("../models/reviewModel");
// const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

exports.getAllReview = factory.getAll(Review);
// exports.getAllReview = catchAsync(async (req, res, next) => {
//   let filter = {};

//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: "sucsses",
//     number: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

exports.setTouruserIds = (req, res, next) => {
  //allow nested routes

  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);
// exports.createReview = catchAsync(async (req, res, next) => {
//   const review = await Review.create(req.body);

//   res.status(201).json({
//     status: "succses",
//     data: {
//       review,
//     },
//   });
// });

exports.getReview = factory.getOne(Review);
exports.updatereview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
