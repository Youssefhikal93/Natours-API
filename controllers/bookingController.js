const Tour = require("../models/tourModel");
const Booking = require("../models/bookingModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const AppError = require("../utils/appError");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.getCheckOutSession = catchAsync(async (req, res, next) => {
  //1) get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  //2) create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/?tour=${tour.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          unit_amount: tour.price * 100,
          currency: "usd",
          product_data: {
            name: `${tour.name} Tour`,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            description: tour.summary,
          },
        },
        quantity: 1,
      },
    ],
    // name: `${tour.name} Tour`,
    // description: tour.summary,
    // images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
    // amount: tour.price * 100,
    // currncy: "usd",
    //     // quantity: 1,
    //   },
    // ],
  });
  //3) create session as response
  res.status(200).json({
    status: "succses",
    session,
  });
});

exports.creatBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split("?")[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
