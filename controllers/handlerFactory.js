const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatuers = require("../utils/apiFeature");
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("no docment found with the ID", 404));
    }
    res.status(204).json({
      status: "succses",
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError("no tour found with the ID", 404));
    }

    res.status(200).json({
      status: "succses",
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: "succses",
      data: {
        data: newDoc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;
    // findByID = findOne({_id:req.params.id})

    if (!doc) {
      return next(new AppError("no doc found with the ID", 404));
    }

    res.status(200).json({
      status: "sucsses",
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // to allowa for nested get reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //AWAIT THE QUERY /---------EXeCUTING--------
    const featuers = new APIFeatuers(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await featuers.query.explain();
    const doc = await featuers.query;

    // SEND RESPONSE
    res.status(200).json({
      status: "sucsses",
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
