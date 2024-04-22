const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

// eslint-disable-next-line arrow-body-style
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIKE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure: true,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Delete the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: "sucsses",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get("host")}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createAndSendToken(newUser, 201, res);
});

// eslint-disable-next-line prefer-arrow-callback
exports.login = catchAsync(async function (req, res, next) {
  const { email, password } = req.body;

  //1) if email and password exist
  if (!email || !password) {
    return next(new AppError("please provdie valid email & password", 400));
  }
  //2)check is user exist && passsword is correct
  const user = await User.findOne({ email: email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("incorrect email or passowrd", 401));
  }

  // 3) if everything is okay
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: "sucsses",
  //   token,
  // });
  createAndSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1) get the token and check if its exitsy
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    // console.log(token);

    //only for rendered pages , no error (NO API)
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("You are not logged in", 401));
  }
  //2) verfiy the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //3)check if user exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError("the user no longer exist", 401));
  }
  //4)checi if user changed the password after the token is issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("user changed Password recently", 401));
  }

  //Grant accses to the protected route
  req.user = freshUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    //roles ["admin bla bla bla "]
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You don't have persmission", 403));
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("there's no user with the email", 404));
  }
  //2) generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) sebd it back to usersc email
  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

  // old method -->
  // const message = `Forgot your password? submit a patch request with your new passowed and passwordConfirm : ${resetURL} , if not you may ignore the email`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
    // old method -->
    // await sendEmail({
    //   email: user.email,
    //   subject: "Your passwrod reset token",
    //   message: message,
    // });
    res.status(200).json({
      status: "sucsses",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("there was an error sneding the email", 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) if token not expired and there is a user ,set new password
  if (!user) {
    return next(new AppError("Token is invalid or expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) update changed passowrdAT property for the user
  //4) log the user in send JWT
  const token = signToken(user._id);
  res.status(200).json({
    status: "sucsses",
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");
  //2) if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Current passowrd incorrect", 401));
  }
  //3) update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4)log iser in , send JWT
  createAndSendToken(user, 200, res);
});
