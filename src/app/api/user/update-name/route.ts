import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

/**
 * Called after OTP verification for new users to set their display name.
 * The user record was already created by the verify route with a placeholder name.
 */
export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, name } = await req.json();

    if (!phoneNumber || !name?.trim()) {
      return NextResponse.json(
        { error: "Phone number and name are required" },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "");

    const user = await db.user.update({
      where: { phoneNumber: cleanPhone },
      data: { name: name.trim() },
    });

    // Re-issue session cookie with updated name
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
    console.error("Update name error:", error);
    return NextResponse.json(
      { error: "Failed to update your name. Please try again." },
      { status: 500 }
    );
  }
}
