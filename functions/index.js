const {setGlobalOptions} = require("firebase-functions");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {getFirestore, FieldValue, Timestamp} =
    require("firebase-admin/firestore");
const {initializeApp} = require("firebase-admin/app");
const crypto = require("crypto");

initializeApp();

setGlobalOptions({
  maxInstances: 10,
  region: "asia-south1",
});

const db = getFirestore();

/**
 * Creates a SHA-256 hash of an OTP.
 * @param {string} otp The OTP to hash.
 * @return {string} The hashed OTP.
 */
function hashOtp(otp) {
  return crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
}

/**
 * Generates a secure six-digit OTP.
 * @return {string} A six-digit OTP.
 */
function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Generates a temporary delivery OTP.
 */
exports.generateOtp = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "You must be logged in.",
    );
  }

  const boxId = request.data && request.data.boxId;

  if (typeof boxId !== "string" || !boxId) {
    throw new HttpsError(
        "invalid-argument",
        "A valid boxId is required.",
    );
  }

  const boxRef = db.collection("boxes").doc(boxId);
  const boxSnap = await boxRef.get();

  if (!boxSnap.exists) {
    throw new HttpsError(
        "not-found",
        "Parcel box not found.",
    );
  }

  const box = boxSnap.data();

  if (box.ownerId !== request.auth.uid) {
    throw new HttpsError(
        "permission-denied",
        "You do not own this parcel box.",
    );
  }

  const otp = generateOtp();

  const expiresAt = Timestamp.fromMillis(
      Date.now() + 5 * 60 * 1000,
  );

  const otpHash = hashOtp(otp);

  const sessionRef = db.collection("otp_sessions").doc();

  await sessionRef.set({
    boxId: boxId,
    otpHash: otpHash,
    status: "ACTIVE",
    used: false,
    attempts: 0,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: expiresAt,
    createdBy: request.auth.uid,
  });

  await db.collection("security_logs").add({
    boxId: boxId,
    event: "OTP_GENERATED",
    result: "SUCCESS",
    userId: request.auth.uid,
    timestamp: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    otp: otp,
    expiresInSeconds: 300,
    sessionId: sessionRef.id,
  };
});
