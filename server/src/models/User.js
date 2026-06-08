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
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
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
    role: {
      type: String,
      enum: ["viewer", "admin"],
      default: "viewer",
    },
    account_type: {
      type: String,
      enum: ["community", "enterprise"],
      default: "community",
    },
    enterprise_status: {
      type: String,
      enum: ["none", "pending", "accepted", "rejected"],
      default: "none",
    },
    company_name: {
      type: String,
      default: "",
      trim: true,
    },
    company_website: {
      type: String,
      default: "",
      trim: true,
    },
    gst_number: {
      type: String,
      default: "",
      trim: true,
    },
    points_total: {
      type: Number,
      default: 0,
      min: 0,
    },
    points_monthly: {
      type: Number,
      default: 0,
      min: 0,
    },
    donated_items_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    donated_units_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    last_points_awarded_at: {
      type: Date,
      default: null,
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
userSchema.index({ account_type: 1, enterprise_status: 1, points_total: -1 });
userSchema.index({ account_type: 1, enterprise_status: 1, points_monthly: -1 });

module.exports = mongoose.model("User", userSchema);
