const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) GET TOUR DATA FROM COLLECTION
  const tours = await Tour.find();

  //2)BUILD TEMPLATE

  //3) RENDER THAT TEMPLETE USING TOUR DATA

  res.status(200).render("overview", {
    title: "All tours",
    tours: tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1) GET TOUR DATA FROM COLLECTION inclucing reviews and tour guide
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  //2)BUILD TEMPLATE

  //3) RENDER THAT TEMPLETE USING TOUR DATA
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "connect-src https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com",
    )
    .render("tour", {
      title: tour.name,
      tour,
    });
});

exports.getLoginForm = (req, res) => {
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "connect-src https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com",
    )
    .render("login", {
      title: "Long into your account",
    });
};
