"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  CalendarIcon,
  Clock,
  Bell,
  User as UserIcon,
  ChevronRight,
  CheckCircle,
  TrendingUp,
  BookOpen,
} from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) setAuthModalOpen(true);
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetch("/api/user/bookings")
        .then((r) => r.json())
        .then((d) => { if (d.bookings) setMyBookings(d.bookings); })
        .catch(console.error)
        .finally(() => setLoadingData(false));
    }
  }, [user]);

  if (authLoading || (!user && !authModalOpen)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Activity className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950">
        <Navbar onOpenAuth={() => setAuthModalOpen(true)} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md w-full glass-panel border border-slate-800 rounded-2xl p-8 text-center space-y-6">
            <AlertCircle className="h-16 w-16 text-emerald-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Login Required</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Please sign in or create an account to view available turf schedules and make bookings.
            </p>
            <button
              suppressHydrationWarning
              onClick={() => setAuthModalOpen(true)}
              className="w-full glow-btn bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl transition-all cursor-pointer"
            >
              Log In / Register
            </button>
          </div>
        </div>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  const confirmedBookings = myBookings.filter((b) => b.status === "CONFIRMED");
  const upcomingBookings = confirmedBookings.filter((b) => new Date(b.date) >= new Date());
  const totalSpent = myBookings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((sum: number, b: any) => sum + (b.paidAmount || 0), 0);

  const now = new Date();
  const notifCount = confirmedBookings.filter((b: any) => {
    const slotDate = new Date(b.date);
    slotDate.setHours(b.startTime);
    const dismissed = typeof window !== "undefined" && localStorage.getItem(`dismissed_booking_${b.id}`);
    return slotDate > now && !dismissed;
  }).length;

  const quickLinks = [
    {
      href: "/dashboard/book-slot",
      label: "Book a Slot",
      description: "Reserve your turf time",
      icon: CalendarIcon,
      color: "emerald",
    },
    {
      href: "/dashboard/booking-history",
      label: "Booking History",
      description: "View all past & upcoming bookings",
      icon: BookOpen,
      color: "blue",
    },
    {
      href: "/dashboard/notifications",
      label: "Notifications",
      description: `${notifCount} active confirmation${notifCount !== 1 ? "s" : ""}`,
      icon: Bell,
      color: "amber",
    },
    {
      href: "/dashboard/profile",
      label: "My Profile",
      description: "Account details & stats",
      icon: UserIcon,
      color: "purple",
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "hover:border-emerald-500/30" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "hover:border-blue-500/30" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "hover:border-amber-500/30" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "hover:border-purple-500/30" },
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Header */}
        <div className="border-b border-slate-800/60 pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">Dashboard</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-emerald-400">{user.name}</span> 👋
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Here&apos;s a summary of your turf activity. Use the navigation above to manage bookings.
          </p>
        </div>

        {/* Stats */}
        {loadingData ? (
          <div className="py-12 flex items-center justify-center">
            <Activity className="h-7 w-7 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Bookings</p>
                <p className="text-2xl font-bold text-white">{myBookings.length}</p>
                <p className="text-[11px] text-slate-500">All time</p>
              </div>
              <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Upcoming</p>
                <p className="text-2xl font-bold text-emerald-400">{upcomingBookings.length}</p>
                <p className="text-[11px] text-slate-500">Confirmed slots</p>
              </div>
              <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Paid</p>
                <p className="text-2xl font-bold text-white">₹{totalSpent}</p>
                <p className="text-[11px] text-slate-500">Advance payments</p>
              </div>
              <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Notifications</p>
                <p className="text-2xl font-bold text-amber-400">{notifCount}</p>
                <p className="text-[11px] text-slate-500">Active alerts</p>
              </div>
            </div>

            {/* Quick Access */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Quick Access</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickLinks.map((item) => {
                  const Icon = item.icon;
                  const c = colorMap[item.color];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`glass-panel border border-slate-800/80 ${c.border} rounded-2xl p-5 flex flex-col gap-4 hover:bg-slate-900/40 transition-all duration-200 group`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-slate-100">{item.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                      </div>
                      <ChevronRight className={`h-4 w-4 ${c.text} ml-auto mt-auto opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Recent bookings preview */}
            {myBookings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Bookings</h2>
                  <Link href="/dashboard/booking-history" className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="glass-panel border border-slate-800/80 rounded-2xl overflow-hidden">
                  {myBookings.slice(0, 4).map((booking: any, i: number) => {
                    const isCancelled = booking.status === "CANCELLED";
                    const date = new Date(booking.date);
                    const dateLabel = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                    const startH = booking.startTime % 12 || 12;
                    const startAmPm = booking.startTime >= 12 ? "PM" : "AM";
                    const endH = booking.endTime % 12 || 12;
                    const endAmPm = booking.endTime >= 12 ? "PM" : "AM";
                    return (
                      <div
                        key={booking.id}
                        className={`flex items-center justify-between px-5 py-4 text-xs ${i < myBookings.slice(0, 4).length - 1 ? "border-b border-slate-800/60" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isCancelled ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                            {isCancelled ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{dateLabel}</p>
                            <p className="text-slate-500 mt-0.5">{startH}:00 {startAmPm} – {endH}:00 {endAmPm}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-300">₹{booking.paidAmount}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            isCancelled
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
