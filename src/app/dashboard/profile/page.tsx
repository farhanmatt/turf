"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Activity,
  User as UserIcon,
  Phone,
  Shield,
  CalendarIcon,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
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

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Activity className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const confirmed = myBookings.filter((b) => b.status === "CONFIRMED");
  const cancelled = myBookings.filter((b) => b.status === "CANCELLED");
  const totalPaid = myBookings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((sum: number, b: any) => sum + (b.paidAmount || 0), 0);
  const now = new Date();
  const upcoming = confirmed.filter((b) => new Date(b.date) >= now);
  const nextBooking = upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const stats = [
    { label: "Total Bookings", value: myBookings.length, color: "text-white" },
    { label: "Confirmed", value: confirmed.length, color: "text-emerald-400" },
    { label: "Cancelled", value: cancelled.length, color: "text-rose-400" },
    { label: "Total Paid", value: `₹${totalPaid}`, color: "text-white" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Header */}
        <div className="border-b border-slate-800/60 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">
            Dashboard / Profile
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
          <p className="text-sm text-slate-400 mt-1">Account details and booking statistics.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Left: Profile card */}
          <div className="space-y-5">
            <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <UserIcon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{user.name}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    user.role === "ADMIN"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    {user.role === "ADMIN" && <Shield className="h-2.5 w-2.5" />}
                    {user.role?.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-3 text-sm">
                  <UserIcon className="h-4 w-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Name</p>
                    <p className="font-semibold text-white">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Phone</p>
                    <p className="font-semibold text-white">{(user as any).phoneNumber || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-800 pt-4 space-y-2">
                {user.role === "ADMIN" && (
                  <button
                    suppressHydrationWarning
                    onClick={() => router.push("/admin")}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  >
                    Go to Admin Panel
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  suppressHydrationWarning
                  onClick={() => { logout(); router.push("/"); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs font-semibold hover:bg-rose-900/30 transition-colors cursor-pointer"
                >
                  Logout
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Stats + upcoming */}
          <div className="lg:col-span-2 space-y-6">

            {loadingData ? (
              <div className="py-12 flex items-center justify-center">
                <Activity className="h-7 w-7 animate-spin text-emerald-500" />
              </div>
            ) : (
              <>
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="glass-panel border border-slate-800/80 rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{stat.label}</p>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Next upcoming booking */}
                {nextBooking ? (
                  <div className="glass-panel border border-emerald-500/20 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-3">Next Upcoming Slot</p>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                        <CalendarIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-white">
                          {new Date(nextBooking.date).toLocaleDateString("en-US", {
                            weekday: "long", month: "short", day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-slate-300 mt-0.5">
                          {formatHour(nextBooking.startTime)} – {formatHour(nextBooking.endTime)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ₹{nextBooking.paidAmount} paid · ₹{nextBooking.totalAmount - nextBooking.paidAmount} due on arrival
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 text-center space-y-3">
                    <CalendarIcon className="h-10 w-10 text-slate-600 mx-auto" />
                    <p className="text-slate-400 font-semibold text-sm">No upcoming bookings</p>
                    <Link
                      href="/dashboard/book-slot"
                      className="inline-flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs hover:bg-emerald-400 transition-colors"
                    >
                      Book a Slot <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}

                {/* Recent activity */}
                {myBookings.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Activity</p>
                      <Link href="/dashboard/booking-history" className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                        View all <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="glass-panel border border-slate-800/80 rounded-2xl overflow-hidden">
                      {myBookings.slice(0, 5).map((booking, i) => {
                        const isConfirmed = booking.status === "CONFIRMED";
                        return (
                          <div
                            key={booking.id}
                            className={`flex items-center justify-between px-5 py-3.5 text-xs ${i < Math.min(myBookings.length, 5) - 1 ? "border-b border-slate-800/60" : ""}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isConfirmed ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                                {isConfirmed ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                              </div>
                              <div>
                                <p className="font-semibold text-white">
                                  {new Date(booking.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </p>
                                <p className="text-slate-500">
                                  {formatHour(booking.startTime)} – {formatHour(booking.endTime)}
                                </p>
                              </div>
                            </div>
                            <span className={`font-semibold ${isConfirmed ? "text-emerald-400" : "text-slate-500"}`}>
                              ₹{booking.paidAmount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
