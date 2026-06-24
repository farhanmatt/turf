import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const expectedUsername = process.env.ADMIN_USERNAME || "admin";
    const expectedPassword = process.env.ADMIN_PASSWORD || "adminpassword";

    if (username !== expectedUsername || password !== expectedPassword) {
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    // Find seeded admin user
    let adminUser = await db.user.findFirst({
      where: {
        role: "ADMIN",
      },
    });

    // Fallback if seed was not run
    if (!adminUser) {
      adminUser = await db.user.create({
        data: {
          name: "Admin User",
          phoneNumber: "1234567890",
          role: "ADMIN",
        },
      });
    }

    // Set the session cookie
    await setSessionCookie({
      userId: adminUser.id,
      role: "ADMIN",
      name: adminUser.name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        role: "ADMIN",
      },
    });
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Something went wrong during login" },
      { status: 500 }
    );
  }
}
