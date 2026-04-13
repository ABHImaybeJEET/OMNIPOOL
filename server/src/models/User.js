const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    firebaseUid: {
      type: String,
      required: [true, "Firebase UID is required"],
      unique: true,
      index: true,
      trim: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    skills_embedding: {
      type: [Number],
      default: [],
      select: false,
    },
    project_history: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProjectRequest",
      },
    ],
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    avatar_url: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    availability: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for geospatial queries
userSchema.index({ location: "2dsphere" });
// Text index for keyword search fallback
userSchema.index({ name: "text", skills: "text", bio: "text" });

module.exports = mongoose.model("User", userSchema);
