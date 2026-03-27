import axios from "axios";
import redisClient from "../config/redis.js";

// In-memory OTP storage for development (when Redis is not available)
const inMemoryOTP = new Map();

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

  if (process.env.NODE_ENV === "development") {
    console.log(`\nOTP for ${phone}: ${otp}\n`);
  } else {
    try {
      await axios.post("https://control.msg91.com/api/v5/otp", null, {
        params: {
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: `91${phone}`,
          authkey: process.env.MSG91_API_KEY,
          otp,
        },
      });
    } catch (error) {
      throw new Error(error?.response?.data?.message || error.message);
    }
  }

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
