"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Activity, AlertCircle, CalendarIcon, ChevronRight } from "lucide-react";

export default function BookingHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/user/bookings")
      .then((r) => r.json())
      .then((d) => { if (d.bookings) setMyBookings(d.bookings); })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [user]);

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
  };

  const formatDateLabel = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Activity className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const confirmed = myBookings.filter((b) => b.status === "CONFIRMED").length;
  const cancelled = myBookings.filter((b) => b.status === "CANCELLED").length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Header */}
        <div className="border-b border-slate-800/60 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">
            Dashboard / Booking History
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Booking History</h1>
          <p className="text-sm text-slate-400 mt-1">All your past and upcoming turf reservations.</p>
        </div>

        {loadingData ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Activity className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="text-sm text-slate-400">Loading bookings...</span>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-white">{myBookings.length}</p>
              </div>
              <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Confirmed</p>
                <p className="text-2xl font-bold text-emerald-400">{confirmed}</p>
              </div>
              <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Cancelled</p>
                <p className="text-2xl font-bold text-rose-400">{cancelled}</p>
              </div>
            </div>

            {/* Booking list */}
            {myBookings.length === 0 ? (
              <div className="glass-panel border border-slate-800/80 rounded-2xl p-12 text-center space-y-4">
                <CalendarIcon className="h-12 w-12 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-semibold">No bookings yet</p>
                <p className="text-sm text-slate-500">
                  You haven&apos;t made any reservations yet.
                </p>
                <Link
                  href="/dashboard/book-slot"
                  className="inline-flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-400 transition-colors"
                >
                  Book Your First Slot
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myBookings.map((booking) => {
                  const isConfirmed = booking.status === "CONFIRMED";
                  const isCancelled = booking.status === "CANCELLED";
                  return (
                    <div
                      key={booking.id}
                      className="glass-panel border border-slate-800/80 rounded-2xl p-5 space-y-4 hover:border-slate-700/80 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                            Booked on {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-base font-bold text-white">{formatDateLabel(booking.date)}</p>
                          <p className="text-sm text-slate-300 mt-0.5">
                            {formatHour(booking.startTime)} – {formatHour(booking.endTime)}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                            isConfirmed
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : isCancelled
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="border-t border-slate-800/60 pt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-slate-500 mb-0.5">Total Amount</p>
                          <p className="font-bold text-white">₹{booking.totalAmount}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-0.5">Paid</p>
                          <p className="font-bold text-emerald-400">₹{booking.paidAmount}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-500 mb-0.5">Balance Due on Arrival</p>
                          <p className="font-semibold text-slate-300">
                            ₹{booking.totalAmount - booking.paidAmount}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
