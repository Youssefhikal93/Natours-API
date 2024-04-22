const mongoose = require("mongoose");
const slugify = require("slugify");
// const User = require("./userModel");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tour Name is required"],
      unique: true,
      trim: true,
      maxLength: [
        40,
        "A tour name must have less or equal than 40 charachters",
      ],
      minLength: [10, "Charchartes must be more than 10 "],
    },
    duration: {
      type: Number,
      required: [true, "Tour must have duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "tour must have group size"],
    },
    difficulty: {
      type: String,
      required: [true, "Tour must have difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "diffifulty must be validated",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1"],
      max: [5, "rating must be lower than 5"],
      set: (value) => Math.round(value * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Tour must have price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          //this only pionts to current doc while creating the doc and not update
          return value < this.price;
        },
        message: "price discount cannot ({VALUE}) be higher than price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "Tour must have description"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "Tour must have a cover image"],
    },
    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    slug: String,

    secretTour: {
      type: Boolean,
      deafult: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        String: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//Docment middleware , run before the save() and Create()
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });

  next();
});

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

// Embedding the Guides -----/////
// tourSchema.pre("save", async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));

//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

//virtual populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// tourSchema.pre("save", function (next) {
//   console.log("will save docment...");
//   next();
// });

// tourSchema.post("save", function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took ${Date.now() - this.start} milli seconds`);
  next();
});

// AGGREGARION MIDDELWARE
tourSchema.pre("aggregate", function (next) {
  if (!Object.keys(this.pipeline()[0])[0] === "$geoNear")
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
