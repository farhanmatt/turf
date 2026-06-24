import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOtpSMS } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const { name, phoneNumber } = await req.json();

    if (!name || !phoneNumber) {
      return NextResponse.json(
        { error: "Name and Phone Number are required" },
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

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

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
      // In non-prod environment, we can return the OTP in response for easy testing
      otpDebug: process.env.NODE_ENV !== "production" ? otpCode : undefined,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong during registration" },
      { status: 500 }
    );
  }
}
