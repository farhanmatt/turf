"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Activity, Bell, CheckCircle, ChevronRight } from "lucide-react";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/user/bookings")
      .then((r) => r.json())
      .then((d) => {
        if (d.bookings) {
          setMyBookings(d.bookings);
          const now = new Date();
          const active = d.bookings.filter((b: any) => {
            if (b.status === "CANCELLED") return false;
            const slotDate = new Date(b.date);
            slotDate.setHours(b.startTime);
            const dismissed = localStorage.getItem(`dismissed_booking_${b.id}`);
            return slotDate > now && !dismissed;
          });
          setNotifications(active);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [user]);

  const dismissNotification = (bookingId: string) => {
    localStorage.setItem(`dismissed_booking_${bookingId}`, "true");
    setNotifications((prev) => prev.filter((n) => n.id !== bookingId));
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Header */}
        <div className="border-b border-slate-800/60 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">
            Dashboard / Notifications
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-400 mt-1">
            Active booking confirmations for your upcoming slots.
          </p>
        </div>

        {loadingData ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Activity className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="text-sm text-slate-400">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass-panel border border-slate-800/80 rounded-2xl p-12 text-center space-y-4">
            <Bell className="h-12 w-12 text-slate-600 mx-auto" />
            <p className="text-slate-400 font-semibold">No active notifications</p>
            <p className="text-sm text-slate-500">
              Booking confirmations for upcoming slots will appear here.
            </p>
            <Link
              href="/dashboard/book-slot"
              className="inline-flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-400 transition-colors"
            >
              Book a Slot
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            <p className="text-xs text-slate-500 font-semibold">
              {notifications.length} active notification{notifications.length !== 1 ? "s" : ""}
            </p>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="glass-panel border border-emerald-500/25 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Booking Confirmed!</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDateLabel(notif.date)} &nbsp;|&nbsp; {formatHour(notif.startTime)} – {formatHour(notif.endTime)}
                    </p>
                    <p className="text-xs text-emerald-400 mt-1">
                      ₹{notif.paidAmount} paid &nbsp;·&nbsp; ₹{notif.totalAmount - notif.paidAmount} due on arrival
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      SMS confirmation was simulated and sent to your phone.
                    </p>
                  </div>
                </div>
                <button
                  suppressHydrationWarning
                  onClick={() => dismissNotification(notif.id)}
                  className="shrink-0 bg-emerald-500 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs hover:bg-emerald-400 cursor-pointer transition-colors"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
