import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, phoneNumber, code } = await req.json();

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: "Phone number and OTP code are required" },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "");

    // Find the latest OTP code for this phone number
    const latestOtp = await db.oTP.findFirst({
      where: {
        phoneNumber: cleanPhone,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!latestOtp) {
      return NextResponse.json(
        { error: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP code matches and is not expired
    if (latestOtp.code !== code) {
      return NextResponse.json(
        { error: "Invalid OTP code. Please try again." },
        { status: 400 }
      );
    }

    if (new Date() > latestOtp.expiresAt) {
      return NextResponse.json(
        { error: "OTP code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Clean up OTP codes for this number
    await db.oTP.deleteMany({
      where: {
        phoneNumber: cleanPhone,
      },
    });

    // Find or create user
    let user = await db.user.findUnique({
      where: {
        phoneNumber: cleanPhone,
      },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          name: name || "User",
          phoneNumber: cleanPhone,
          role: "USER",
        },
      });
    }

    // Set the session cookie
    await setSessionCookie({
      userId: user.id,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong during verification" },
      { status: 500 }
    );
  }
}
