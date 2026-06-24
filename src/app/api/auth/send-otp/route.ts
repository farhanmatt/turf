import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOtpSMS } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Clean phone number (only digits, basic validation)
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid phone number" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Delete any previous OTPs for this number
    await db.oTP.deleteMany({ where: { phoneNumber: cleanPhone } });

    // Save OTP to DB
    await db.oTP.create({
      data: {
        phoneNumber: cleanPhone,
        code: otpCode,
        expiresAt,
      },
    });

    // Send OTP SMS (Simulated)
    await sendOtpSMS(cleanPhone, otpCode);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your phone number",
      isNewUser: !existingUser,
      // Always return the OTP in response for easy testing (even in production)
      otpDebug: otpCode,
    });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
