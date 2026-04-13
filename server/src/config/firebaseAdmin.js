const admin = require("firebase-admin");

let initialized = false;

const getPrivateKey = () => {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) return undefined;
  return privateKey.replace(/\\n/g, "\n");
};

const getServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed;
    } catch (error) {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON");
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  }

  return null;
};

const initializeFirebaseAdmin = () => {
  if (initialized) {
    return admin;
  }

  if (admin.apps.length > 0) {
    initialized = true;
    return admin;
  }

  const serviceAccount = getServiceAccount();

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  initialized = true;
  return admin;
};

module.exports = initializeFirebaseAdmin;
