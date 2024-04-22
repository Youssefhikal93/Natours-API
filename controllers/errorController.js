const AppError = require("./../utils/appError");

const handelJsonWebTokenError = () => new AppError("Invalid token", 401);

const handelJWTExpiredError = () => new AppError("Token expired", 401);

const handleCastErrorDB = (err) => {
  const message = `invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};

const handelValidationDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `invalid input data ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  const value = Object.values(err.keyValue);
  const field = Object.keys(err.keyValue);

  // const [field, value] = Object.entries(err.keyValue)[0];

  //   const value = err.keyValue[1];
  //   console.log(err.keyValue);
  //   console.log(value);
  //   console.log(Object.keys(err.keyValue));
  const message = `duplicated field ${field} value ${value}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational error and trueste : send msg to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or other error,unkown:don't leak details
  } else {
    //Log error
    console.error("ERROR", err);
    // send generaic msg
    res.status(500).json({
      status: "error",
      message: "something went wrong",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    if (err.name === "CastError") error = handleCastErrorDB(error);

    if (err.code === 11000) error = handleDuplicateFieldDB(error);

    if (err.name === "ValidationError") error = handelValidationDB(error);

    if (err.name === "JsonWebTokenError")
      error = handelJsonWebTokenError(error);

    if (err.name === "TokenExpiredError") error = handelJWTExpiredError(error);

    sendErrorProd(error, res);
  }
};
