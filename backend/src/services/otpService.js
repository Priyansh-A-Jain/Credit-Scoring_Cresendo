import axios from "axios";
import twilio from "twilio";
import redisClient from "../config/redis.js";

// In-memory OTP storage for development (when Redis is not available)
const inMemoryOTP = new Map();

// Twilio configuration (read once from environment)
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = process.env;

const hasTwilioConfig =
  Boolean(TWILIO_ACCOUNT_SID) &&
  Boolean(TWILIO_AUTH_TOKEN) &&
  Boolean(TWILIO_PHONE_NUMBER);

// Simple helper to normalise phone numbers to E.164-like format
const toE164 = (rawPhone) => {
  if (!rawPhone) return undefined;
  const trimmed = String(rawPhone).trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("+")) return trimmed;
  // If 10 digits and no country code, assume Indian mobile
  if (/^\d{10}$/.test(trimmed)) {
    return `+91${trimmed}`;
  }
  // Fallback: ensure a leading + and strip any existing + duplicates
  return `+${trimmed.replace(/^\+/, "")}`;
};

export const sendOTP = async (phone) => {
  console.log(
    `sendOTP called with phone: ${phone}, NODE_ENV: ${process.env.NODE_ENV}`
  );

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Generated OTP: ${otp}`);

  try {
    // Try to use Redis first
    await redisClient.setex(`otp:${phone}`, 300, otp);
    console.log(`OTP stored in Redis`);
  } catch (error) {
    // Fallback to in-memory storage when Redis is unavailable.
    console.log(`Redis error: ${error.message}`);
    console.warn("Redis not available, using in-memory OTP storage");
    inMemoryOTP.set(`otp:${phone}`, otp);
    // Set expiration (5 minutes = 300 seconds)
    setTimeout(() => {
      inMemoryOTP.delete(`otp:${phone}`);
    }, 300000);
    console.log(`OTP stored in-memory`);
  }

  // NOTE: OTP is still logged in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.log(`\nOTP for ${phone}: ${otp}\n`); // <-- OTP logged here
  }

  // NEW: Send OTP via Twilio SMS (without changing storage logic)
  if (hasTwilioConfig) {
    const toNumber = toE164(phone);

    if (!toNumber) {
      console.warn(
        `[otpService] Skipping Twilio SMS — could not normalise phone: ${phone}`
      );
    } else {
      try {
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        await client.messages.create({
          from: TWILIO_PHONE_NUMBER,
          to: toNumber,
          body: `Your OTP is ${otp}. It will expire in 5 minutes.`,
        });

        console.log(
          `[otpService] OTP SMS sent via Twilio to ${toNumber}`
        );
      } catch (smsError) {
        // If SMS fails, log the error but do not break existing flow
        console.error(
          "[otpService] Error sending OTP SMS via Twilio:",
          smsError
        );
      }
    }
  } else {
    console.warn(
      "[otpService] Twilio env vars not fully configured; skipping SMS send."
    );
  }

  // ALTERNATIVE (commented): MSG91-based implementation for Indian SMS delivery
  // Kept here as a reference if you want to switch providers.
  /*
  try {
    await axios.post("https://control.msg91.com/api/v5/otp", null, {
      params: {
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: `91${phone}`,
        authkey: process.env.MSG91_API_KEY,
        otp,
      },
    });
    console.log(`[otpService] OTP SMS sent via MSG91 to 91${phone}`);
  } catch (error) {
    console.error("[otpService] Error sending OTP SMS via MSG91:", error);
  }
  */

  return { message: "OTP sent" };
};

export const verifyOTP = async (phone, enteredOTP) => {
  const redisKey = `otp:${phone}`;
  let storedOTP;

  try {
    // Try to get from Redis first
    storedOTP = await redisClient.get(redisKey);
  } catch (error) {
    // Fallback to in-memory storage
    storedOTP = inMemoryOTP.get(redisKey);
  }

  if (!storedOTP) {
    throw new Error("OTP expired");
  }

  if (storedOTP !== String(enteredOTP)) {
    throw new Error("Incorrect OTP");
  }

  try {
    // Try to delete from Redis
    await redisClient.del(redisKey);
  } catch (error) {
    // Fallback to in-memory deletion
    inMemoryOTP.delete(redisKey);
  }

  return { verified: true };
};
