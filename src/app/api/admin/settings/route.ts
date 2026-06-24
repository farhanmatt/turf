import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { validatePricingRules } from "@/lib/pricing";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeClosedDays(input: unknown): { dates: string[]; error?: string } {
  if (input === undefined || input === null) {
    return { dates: [] };
  }

  if (!Array.isArray(input)) {
    return { dates: [], error: "Closed days must be an array" };
  }

  const dates = new Set<string>();

  for (const date of input) {
    if (typeof date !== "string" || !DATE_PATTERN.test(date)) {
      return { dates: [], error: "Closed days must use YYYY-MM-DD format" };
    }

    dates.add(date);
  }

  return { dates: Array.from(dates) };
}

// Public endpoint to get turf settings
export async function GET() {
  try {
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
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: settings.id,
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        pricePerHour: settings.pricePerHour,
        advancePaymentPercent: settings.advancePaymentPercent,
        closedDays: settings.closedDays.map((cd) => cd.date),
        pricingRules: settings.pricingRules.map((rule) => ({
          id: rule.id,
          startTime: rule.startTime,
          endTime: rule.endTime,
          pricePerHour: rule.pricePerHour,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch turf settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Admin-only endpoint to update turf settings
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { openingTime, closingTime, pricePerHour, closedDays, advancePaymentPercent } = body;
    const shouldUpdatePricingRules = Object.prototype.hasOwnProperty.call(body, "pricingRules");
    const parsedPricePerHour = Number(pricePerHour);
    const parsedAdvancePercent = advancePaymentPercent !== undefined ? Number(advancePaymentPercent) : undefined;

    if (!openingTime || !closingTime || pricePerHour === undefined) {
      return NextResponse.json(
        { error: "Opening time, closing time, and price per hour are required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(parsedPricePerHour) || parsedPricePerHour <= 0) {
      return NextResponse.json({ error: "Price per hour must be a valid amount" }, { status: 400 });
    }

    if (
      parsedAdvancePercent !== undefined &&
      (!Number.isInteger(parsedAdvancePercent) || parsedAdvancePercent < 1 || parsedAdvancePercent > 100)
    ) {
      return NextResponse.json(
        { error: "Advance payment percentage must be a whole number between 1 and 100" },
        { status: 400 }
      );
    }

    const closedDaysValidation = normalizeClosedDays(closedDays);
    if (closedDaysValidation.error) {
      return NextResponse.json({ error: closedDaysValidation.error }, { status: 400 });
    }

    const pricingValidation = shouldUpdatePricingRules
      ? validatePricingRules(body.pricingRules)
      : { rules: [] };

    if (pricingValidation.error) {
      return NextResponse.json({ error: pricingValidation.error }, { status: 400 });
    }

    // Update settings transactionally
    const updatedSettings = await db.$transaction(async (tx) => {
      // 1. Delete all existing closed days
      await tx.closedDay.deleteMany({
        where: { turfSettingsId: "default" },
      });

      if (shouldUpdatePricingRules) {
        await tx.timePricingRule.deleteMany({
          where: { turfSettingsId: "default" },
        });
      }

      // 2. Update core settings and recreate closed days/pricing rules
      return await tx.turfSettings.update({
        where: { id: "default" },
        data: {
          openingTime,
          closingTime,
          pricePerHour: parsedPricePerHour,
          ...(parsedAdvancePercent !== undefined ? { advancePaymentPercent: parsedAdvancePercent } : {}),
          closedDays: {
            create: closedDaysValidation.dates.map((date) => ({
              date,
            })),
          },
          ...(shouldUpdatePricingRules
            ? {
                pricingRules: {
                  create: pricingValidation.rules,
                },
              }
            : {}),
        },
        include: {
          closedDays: true,
          pricingRules: {
            orderBy: {
              startTime: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      settings: {
        id: updatedSettings.id,
        openingTime: updatedSettings.openingTime,
        closingTime: updatedSettings.closingTime,
        pricePerHour: updatedSettings.pricePerHour,
        advancePaymentPercent: updatedSettings.advancePaymentPercent,
        closedDays: updatedSettings.closedDays.map((cd) => cd.date),
        pricingRules: updatedSettings.pricingRules.map((rule) => ({
          id: rule.id,
          startTime: rule.startTime,
          endTime: rule.endTime,
          pricePerHour: rule.pricePerHour,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to update turf settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
