import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendBookingConfirmationSMS } from "@/lib/sms";
import { calculateBookingAmount } from "@/lib/pricing";

// Get dates for the rolling 7 days starting from today (in YYYY-MM-DD format)
function getRolling7Days(baseDateStr?: string): string[] {
  const dates: string[] = [];
  const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
}

// GET bookings: Admin views all, Users view next 7 days blockages
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const isAdminView = searchParams.get("admin") === "true";

    if (isAdminView) {
      if (!session || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Fetch all bookings with user details
      const bookings = await db.booking.findMany({
        include: {
          user: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      return NextResponse.json({ success: true, bookings });
    }

    // Default: Public/User view of the next 7 days bookings
    const rollingDays = getRolling7Days();
    const bookings = await db.booking.findMany({
      where: {
        date: {
          in: rollingDays,
        },
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      bookings,
      rollingDays,
    });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new booking
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in to book a slot" }, { status: 401 });
    }

    const { date, startTime, endTime, paidAmount, referenceDetails } = await req.json();
    const parsedStartTime = Number(startTime);
    const parsedEndTime = Number(endTime);
    const parsedPaidAmount = Number(paidAmount);

    // Basic validation
    if (!date || startTime === undefined || endTime === undefined || paidAmount === undefined) {
      return NextResponse.json({ error: "Missing required booking details" }, { status: 400 });
    }

    if (
      !Number.isInteger(parsedStartTime) ||
      !Number.isInteger(parsedEndTime) ||
      parsedStartTime < 0 ||
      parsedEndTime > 24 ||
      !Number.isFinite(parsedPaidAmount)
    ) {
      return NextResponse.json({ error: "Invalid booking details" }, { status: 400 });
    }

    if (parsedStartTime >= parsedEndTime) {
      return NextResponse.json({ error: "Start time must be before end time" }, { status: 400 });
    }

    // 1. Check if date is in the rolling 7 days
    const rollingDays = getRolling7Days();
    if (!rollingDays.includes(date)) {
      return NextResponse.json(
        { error: "Bookings can only be made for the next 7 days" },
        { status: 400 }
      );
    }

    // Fetch settings and check if closed
    const settings = await db.turfSettings.findUnique({
      where: { id: "default" },
      include: {
        closedDays: true,
        pricingRules: {
          orderBy: {
            startTime: "asc",
          },
        },
      },
    });

    if (!settings) {
      return NextResponse.json({ error: "Turf settings not configured" }, { status: 500 });
    }

    // 2. Check if the day is closed
    const isClosed = settings.closedDays.some((cd) => cd.date === date);
    if (isClosed) {
      return NextResponse.json({ error: "The turf is closed on this day" }, { status: 400 });
    }

    // 3. Validate operating hours
    // Convert e.g., "06:00" to 6 and "22:00" to 22
    const openingHour = parseInt(settings.openingTime.split(":")[0], 10);
    const closingHour = parseInt(settings.closingTime.split(":")[0], 10);

    if (parsedStartTime < openingHour || parsedEndTime > closingHour) {
      return NextResponse.json(
        {
          error: `Bookings must be within operating hours (${settings.openingTime} to ${settings.closingTime})`,
        },
        { status: 400 }
      );
    }

    // 4. Overlap prevention query
    // An overlap occurs if a booking on the same date has:
    // start_time < new_end_time AND end_time > new_start_time
    const overlapping = await db.booking.findFirst({
      where: {
        date,
        status: {
          not: "CANCELLED",
        },
        startTime: {
          lt: parsedEndTime,
        },
        endTime: {
          gt: parsedStartTime,
        },
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "This time slot overlaps with an existing booking" },
        { status: 409 }
      );
    }

    // 5. Pricing and advance payment validation
    const { totalAmount } = calculateBookingAmount(
      parsedStartTime,
      parsedEndTime,
      settings.pricePerHour,
      settings.pricingRules
    );
    
    const advancePercent = settings.advancePaymentPercent ?? 50;
    const minRequiredAdvance = Math.round(totalAmount * (advancePercent / 100));

    if (parsedPaidAmount < minRequiredAdvance) {
      return NextResponse.json(
        {
          error: `Minimum payment of ${advancePercent}% (₹${minRequiredAdvance}) is required to confirm booking`,
        },
        { status: 400 }
      );
    }

    // 6. Create booking
    const booking = await db.booking.create({
      data: {
        userId: session.userId,
        date,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        totalAmount,
        paidAmount: parsedPaidAmount,
        status: "CONFIRMED", // Advance payment confirmed
        referenceDetails: referenceDetails || "Simulated Payment",
      },
      include: {
        user: {
          select: {
            phoneNumber: true,
          },
        },
      },
    });

    // 7. Send confirmation SMS
    const formatTime = (hour: number) => {
      const ampm = hour >= 12 ? "PM" : "AM";
      const h = hour % 12 || 12;
      return `${h}:00 ${ampm}`;
    };

    const timeRangeStr = `${formatTime(parsedStartTime)} - ${formatTime(parsedEndTime)}`;
    await sendBookingConfirmationSMS(booking.user.phoneNumber, {
      date: booking.date,
      time: timeRangeStr,
      reference: booking.id.substring(0, 8).toUpperCase(),
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalAmount: booking.totalAmount,
        paidAmount: booking.paidAmount,
        status: booking.status,
        referenceDetails: booking.referenceDetails,
      },
    });
  } catch (error) {
    console.error("Failed to create booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
