"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { calculateBookingAmount, getHourlyRate } from "@/lib/pricing";
import {
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CreditCard,
  Activity,
} from "lucide-react";

interface Booking {
  id: string;
  date: string;
  startTime: number;
  endTime: number;
  status: string;
}

interface TimePricingRule {
  id?: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
}

interface TurfSettings {
  openingTime: string;
  closingTime: string;
  pricePerHour: number;
  advancePaymentPercent: number;
  closedDays: string[];
  pricingRules: TimePricingRule[];
}

export default function BookSlotPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [settings, setSettings] = useState<TurfSettings | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rollingDays, setRollingDays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [startTime, setStartTime] = useState<number>(8);
  const [endTime, setEndTime] = useState<number>(9);

  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [refDetails, setRefDetails] = useState("");

  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [settingsRes, bookingsRes] = await Promise.all([
          fetch("/api/admin/settings"),
          fetch("/api/bookings"),
        ]);
        if (settingsRes.ok) {
          const d = await settingsRes.json();
          setSettings(d.settings);
          const openHour = parseInt(d.settings.openingTime.split(":")[0], 10);
          setStartTime(openHour);
          setEndTime(openHour + 1);
        }
        if (bookingsRes.ok) {
          const d = await bookingsRes.json();
          setBookings(d.bookings);
          setRollingDays(d.rollingDays);
          if (d.rollingDays.length > 0) setSelectedDate(d.rollingDays[0]);
        }
      } catch {
        setErrorMsg("Failed to load schedule data.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [user]);

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
  };

  const formatDateLabel = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
  };

  const formatCurrency = (amount: number) =>
    `₹${amount.toFixed(Number.isInteger(amount) ? 0 : 2)}`;

  const handleOpenCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (isSelectedDateClosed) { setErrorMsg("The turf is closed on this day."); return; }
    if (startTime >= endTime) { setErrorMsg("Start time must be before end time."); return; }
    const hasOverlap = bookings.some(
      (b) => b.date === selectedDate && b.startTime < endTime && b.endTime > startTime
    );
    if (hasOverlap) { setErrorMsg("Selected slot overlaps with an existing booking."); return; }
    setPaymentAmount(minPayment);
    setShowCheckout(true);
  };

  const handleConfirmBooking = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: selectedDate,
            startTime,
            endTime,
            paidAmount: paymentAmount,
            referenceDetails: refDetails || `Card ending in ${Math.floor(1000 + Math.random() * 9000)}`,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "Booking failed.");
        } else {
          setShowCheckout(false);
          setSuccessMsg(
            `Booking confirmed! ${formatDateLabel(selectedDate)}, ${formatHour(startTime)} – ${formatHour(endTime)}`
          );
          // Refresh bookings to reflect booked slots
          const fresh = await fetch("/api/bookings");
          if (fresh.ok) { const d = await fresh.json(); setBookings(d.bookings); }
        }
      } catch {
        setErrorMsg("Failed to connect to the server.");
      }
    });
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Activity className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const openingHour = settings ? parseInt(settings.openingTime.split(":")[0], 10) : 6;
  const closingHour = settings ? parseInt(settings.closingTime.split(":")[0], 10) : 22;
  const startHourOptions: number[] = [];
  for (let h = openingHour; h < closingHour; h++) startHourOptions.push(h);
  const endHourOptions: number[] = [];
  for (let h = startTime + 1; h <= closingHour; h++) endHourOptions.push(h);

  const isSelectedDateClosed = settings?.closedDays.includes(selectedDate) || false;
  const basePricePerHour = settings?.pricePerHour || 500;
  const activePricingRules = settings?.pricingRules || [];
  const scheduleSlots = [];
  for (let h = openingHour; h < closingHour; h++) {
    const isBooked = bookings.some(
      (b) => b.date === selectedDate && b.startTime < h + 1 && b.endTime > h
    );
    scheduleSlots.push({
      hour: h,
      label: `${formatHour(h)} – ${formatHour(h + 1)}`,
      pricePerHour: getHourlyRate(h, basePricePerHour, activePricingRules),
      isBooked,
    });
  }

  const duration = endTime - startTime;
  const pricingBreakdown =
    duration > 0
      ? calculateBookingAmount(startTime, endTime, basePricePerHour, activePricingRules)
      : { totalAmount: 0, segments: [] };
  const pricePerHour = pricingBreakdown.segments[0]?.pricePerHour || basePricePerHour;
  const totalCost = pricingBreakdown.totalAmount;
  const advancePercent = settings?.advancePaymentPercent ?? 50;
  const minPayment = Math.round(totalCost * advancePercent / 100);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Page header */}
        <div className="border-b border-slate-800/60 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">Dashboard / Book Slot</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Book a Turf Slot</h1>
          <p className="text-sm text-slate-400 mt-1">Select a date and time window to reserve your spot.</p>
        </div>

        {/* Notices */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-800/80 p-4 text-sm text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-800/80 p-4 text-sm text-emerald-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {loadingData ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Activity className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="text-sm text-slate-400">Loading schedule...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Left: Calendar & hourly schedule */}
            <div className="lg:col-span-2 space-y-6">

              {/* Date selector */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-emerald-400" />
                  Select Date
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {rollingDays.map((dateStr) => {
                    const isClosed = settings?.closedDays.includes(dateStr) || false;
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button
                        suppressHydrationWarning
                        key={dateStr}
                        onClick={() => { setSelectedDate(dateStr); setErrorMsg(""); setSuccessMsg(""); }}
                        className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : isClosed
                            ? "bg-slate-950 border-slate-900 text-slate-600 line-through opacity-60"
                            : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">
                          {new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className="text-base font-bold mt-1">{new Date(dateStr).getDate()}</span>
                        <span className="text-[9px] mt-1 text-slate-500 font-semibold uppercase">
                          {isClosed ? "Closed" : "Open"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hourly schedule */}
              <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    Hourly Schedule ({formatDateLabel(selectedDate)})
                  </h2>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-400">Available</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      <span className="text-slate-400">Booked</span>
                    </span>
                  </div>
                </div>

                {isSelectedDateClosed ? (
                  <div className="py-12 text-center bg-slate-950/40 rounded-xl border border-slate-900 space-y-2">
                    <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
                    <h3 className="text-base font-bold text-white">Turf Closed</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">The turf is closed on this day.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {scheduleSlots.map((slot) => (
                      <div
                        key={slot.hour}
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium transition-all ${
                          slot.isBooked
                            ? "bg-rose-950/20 border-rose-900/60 text-rose-300"
                            : "bg-emerald-950/5 border-emerald-900/40 text-emerald-400"
                        }`}
                      >
                        <span>{slot.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">
                            {formatCurrency(slot.pricePerHour)}/hr
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            slot.isBooked ? "bg-rose-900/40 text-rose-400" : "bg-emerald-950 text-emerald-400"
                          }`}>
                            {slot.isBooked ? "Booked" : "Available"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Booking form */}
            <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
                Select Booking Slot
              </h2>

              {isSelectedDateClosed ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Reserving is unavailable on closed days.
                </div>
              ) : (
                <form onSubmit={handleOpenCheckout} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Start Time</label>
                    <select
                      suppressHydrationWarning
                      value={startTime}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setStartTime(val);
                        if (endTime <= val) setEndTime(val + 1);
                      }}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                    >
                      {startHourOptions.map((h) => (
                        <option key={h} value={h}>{formatHour(h)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">End Time</label>
                    <select
                      suppressHydrationWarning
                      value={endTime}
                      onChange={(e) => setEndTime(parseInt(e.target.value, 10))}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                    >
                      {endHourOptions.map((h) => (
                        <option key={h} value={h}>{formatHour(h)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pricing breakdown */}
                  <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-4 space-y-3 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Duration</span>
                      <span className="font-bold text-white">{duration} Hour{duration > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{pricingBreakdown.segments.length > 1 ? "Starting rate" : "Rate per hour"}</span>
                      <span className="font-bold text-white">₹{pricePerHour}</span>
                    </div>
                    {pricingBreakdown.segments.length > 1 && (
                      <div className="space-y-1.5 border-t border-slate-800 pt-2 text-slate-400">
                        {pricingBreakdown.segments.map((seg: any) => (
                          <div key={`${seg.startTime}-${seg.endTime}`} className="flex justify-between">
                            <span>{formatHour(seg.startTime)} – {formatHour(seg.endTime)}</span>
                            <span className="font-bold text-white">{formatCurrency(seg.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-emerald-400 text-sm">
                      <span>Total Amount</span>
                      <span>₹{totalCost}</span>
                    </div>
                    <div className="pt-1 flex justify-between text-[11px] text-slate-400">
                      <span>Min. Advance ({advancePercent}%)</span>
                      <span className="font-semibold">₹{minPayment}</span>
                    </div>
                  </div>

                  <button
                    suppressHydrationWarning
                    type="submit"
                    className="w-full glow-btn bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl transition-all cursor-pointer text-xs"
                  >
                    Proceed to Payment
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Payment Checkout</h2>
              <p className="text-xs text-slate-400">Confirm your timing and choose advance payment.</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Date</span>
                <span className="font-bold text-white">{formatDateLabel(selectedDate)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Time Slot</span>
                <span className="font-bold text-white">{formatHour(startTime)} – {formatHour(endTime)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Amount</span>
                <span className="font-bold text-emerald-400">₹{totalCost}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Choose Payment Amount</span>
                <span className="text-emerald-400 font-bold">₹{paymentAmount}</span>
              </div>
              <input
                suppressHydrationWarning
                type="range"
                min={minPayment}
                max={totalCost}
                step={10}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>{advancePercent}% min (₹{minPayment})</span>
                <span>100% (₹{totalCost})</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                Simulated Card / UPI Ref (Optional)
              </label>
              <input
                suppressHydrationWarning
                type="text"
                placeholder="e.g. UPI Ref, Cardholder Name"
                value={refDetails}
                onChange={(e) => setRefDetails(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setShowCheckout(false)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 py-2.5 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                suppressHydrationWarning
                type="button"
                disabled={isPending}
                onClick={handleConfirmBooking}
                className="flex-1 glow-btn bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl disabled:opacity-50 text-xs cursor-pointer"
              >
                {isPending ? "Confirming..." : `Pay ₹${paymentAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
