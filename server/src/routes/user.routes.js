const express = require("express");
const router = express.Router();
const {
  getUsers,
  createUser,
  loginUser,
  googleAuth,
  syncUser,
  getUserById,
  updateUser,
  applyEnterprise,
  getEnterpriseApplications,
  updateEnterpriseStatus,
  getLeaderboard,
  getMyRank,
} = require("../controllers/user.controller");
const auth = require("../middleware/auth");

router.route("/").get(getUsers).post(createUser);

router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/sync", syncUser);
router.get("/leaderboard", getLeaderboard);
router.get("/me/rank", auth, getMyRank);

// Admin Enterprise Routes
router.get("/enterprise/applications", auth, getEnterpriseApplications);
router.put("/enterprise/:id/status", auth, updateEnterpriseStatus);

// Regular Enterprise Apply Route
router.post("/enterprise", auth, applyEnterprise);

router.route("/:id").get(getUserById).put(auth, updateUser);

module.exports = router;
