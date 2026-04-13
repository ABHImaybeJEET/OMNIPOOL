const express = require("express");
const router = express.Router();
const {
  getUsers,
  syncUser,
  getUserById,
  updateUser,
} = require("../controllers/user.controller");
const auth = require("../middleware/auth");

router.route("/").get(getUsers);

router.post("/sync", auth, syncUser);

router.route("/:id").get(getUserById).put(auth, updateUser);

module.exports = router;
