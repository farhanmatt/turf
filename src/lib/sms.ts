import fs from "fs";
import path from "path";

// File path for SMS simulation logs
const LOG_FILE_PATH = path.join(process.cwd(), "sms_log.txt");

export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  const logEntry = `[${new Date().toISOString()}] To: ${phoneNumber} | Message: ${message}\n`;
  
  // Log to console for the dev to see
  console.log(`\n--- [SMS SIMULATION] ---`);
  console.log(`To: ${phoneNumber}`);
  console.log(`Message: ${message}`);
  console.log(`------------------------\n`);

  try {
    // Append to local log file in workspace root
    fs.appendFileSync(LOG_FILE_PATH, logEntry, "utf8");
    return true;
  } catch (err) {
    console.error("Failed to write to simulated SMS log file:", err);
    return false;
  }
}

export async function sendOtpSMS(phoneNumber: string, otpCode: string): Promise<boolean> {
  const message = `Your Turf Booking OTP is: ${otpCode}. It is valid for the next 5 minutes.`;
  return await sendSMS(phoneNumber, message);
}

export async function sendBookingConfirmationSMS(
  phoneNumber: string,
  details: { date: string; time: string; reference: string }
): Promise<boolean> {
  const message = `Booking Confirmed! Date: ${details.date}, Time: ${details.time}, Ref: ${details.reference}. Thank you for booking with us!`;
  return await sendSMS(phoneNumber, message);
}
