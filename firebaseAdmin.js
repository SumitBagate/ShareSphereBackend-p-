const admin = require("firebase-admin");

if (!admin.apps.length) {
    const serviceAccount = require("./config/serviceAccountKey.json");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

module.exports = admin;
