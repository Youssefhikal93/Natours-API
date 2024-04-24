const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors")
// const cookieParser = require("cookie-parser");

const tourRouter = require("./routes/tourRoute");
const userRouter = require("./routes/userRoute");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const reviewRouter = require("./routes/reviewRoute");
const viewRouter = require("./routes/viewRoutes");
const bookingRouter = require("./routes/bookingRoutes");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//1) GLOBAL MIddlewares//-----------------
//allow control allow origin from any web or sub domain to ur API
app.use(cors())
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

//Secuirty HTTP headers
app.use(helmet());

//Devleopment logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Body prser , reading data from body to req.body
app.use(express.json({ limit: "10kb" }));
// app.use(cookieParser());
// console.log(req.cookies);
// next();

//Data Sanitization aganist NOSQL query injection (MONGODB signs)
app.use(mongoSanitize());

//DATA sanitization against XSS (HTML sybmols)
app.use(xss());

//Prevernt praater pollution (Duplication)
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "difficulty",
      "ratingsAverage",
      "price",
    ],
  }),
);

//Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, "public")));

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

//LIMIT request from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: " too many requests from this IP , try again after 1 hour",
});
app.use("/api", limiter);

// app.get("/api/v1/tours", getAllTours);
// app.post("/api/v1/tours", createTour);
// app.get("/api/v1/tours/:id", getTour);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);

// 3) Routes

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

app.all("*", (req, res, next) => {
  // res.status(404).json({
  //   status: "fail",
  //   message: `can't find ${req.originalUrl} on the server `,
  // });
  // const err = new Error(`can't find ${req.originalUrl} on the server `);
  // err.status = " fail";
  // err.statusCode = 404;

  next(new AppError(`can't find ${req.originalUrl} on the server `, 404));
});

app.use(globalErrorHandler);

module.exports = app;

