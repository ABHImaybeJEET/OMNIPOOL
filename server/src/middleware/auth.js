const initializeFirebaseAdmin = require("../config/firebaseAdmin");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const admin = initializeFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token, true);

    if (!decoded?.uid) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    req.firebaseUid = decoded.uid;
    req.firebaseToken = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
};

module.exports = auth;
