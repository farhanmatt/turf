"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { Activity, LogOut, User as UserIcon, Calendar, Menu, X, Shield, Bell } from "lucide-react";

interface NavbarProps {
  onOpenAuth?: () => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && isDashboard) {
      fetch("/api/user/bookings")
        .then((r) => r.json())
        .then((d) => {
          if (d.bookings) {
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
        .catch(console.error);
    }
  }, [user, isDashboard]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 transition-transform group-hover:scale-105">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-wider text-white">
            APEX<span className="text-emerald-400">TURF</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          {isDashboard ? (
            <>
              {[
                { href: "/dashboard", label: "Dashboard", exact: true },
                { href: "/dashboard/book-slot", label: "Book Slot", exact: false },
                { href: "/dashboard/booking-history", label: "Booking History", exact: false },
                { href: "/dashboard/profile", label: "Profile", exact: false },
              ].map(({ href, label, exact }) => {
                const active = exact ? pathname === href : pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative text-sm font-medium transition-colors pb-1 ${
                      active ? "text-emerald-400" : "text-slate-300 hover:text-emerald-400"
                    }`}
                  >
                    {label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-400" />
                    )}
                  </Link>
                );
              })}
            </>
          ) : (
            <>
              <Link href="/" className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors">
                Home
              </Link>
              <Link href="/#facilities" className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors">
                Facilities
              </Link>
              <Link href="/#contact" className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors">
                Contact
              </Link>
              {user && (
                <Link
                  href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
                  className="flex items-center space-x-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{user.role === "ADMIN" ? "Admin Panel" : "Book Slots"}</span>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Auth Buttons / Profile */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              {isDashboard && (
                <div className="relative" ref={notificationsRef}>
                  <button
                    suppressHydrationWarning
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
                      <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                        <span className="text-sm font-semibold text-white">Notifications</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                          {notifications.length} new
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No active notifications
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <Link
                              href="/dashboard/notifications"
                              key={notif.id}
                              onClick={() => setShowNotifications(false)}
                              className="block p-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors last:border-0"
                            >
                              <p className="text-xs font-semibold text-emerald-400">Booking Confirmed</p>
                              <p className="text-[11px] text-slate-300 mt-0.5">
                                {new Date(notif.date).toLocaleDateString("en-US", {
                                  weekday: "short", month: "short", day: "numeric",
                                })} • {notif.startTime % 12 || 12}:00 {notif.startTime >= 12 ? "PM" : "AM"}
                              </p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center space-x-2 rounded-full bg-slate-900 border border-slate-800 px-3 py-1.5">
                {user.role === "ADMIN" ? (
                  <Shield className="h-4 w-4 text-emerald-400" />
                ) : (
                  <UserIcon className="h-4 w-4 text-slate-400" />
                )}
                <span className="text-xs font-semibold text-slate-300">
                  {user.name}
                </span>
              </div>
              <button
                suppressHydrationWarning
                onClick={logout}
                className="flex items-center space-x-1 text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              suppressHydrationWarning
              onClick={() => onOpenAuth?.()}
              className="glow-btn bg-emerald-500 text-slate-950 font-semibold text-sm px-5 py-2 rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Book Now
            </button>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center space-x-3">
          {user && isDashboard && (
            <Link
              href="/dashboard/notifications"
              className="relative p-2 text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
              )}
            </Link>
          )}
          <button
            suppressHydrationWarning
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 py-4 space-y-4">
          <nav className="flex flex-col space-y-3">
            {isDashboard ? (
              <>
                {[
                  { href: "/dashboard", label: "Dashboard", exact: true },
                  { href: "/dashboard/book-slot", label: "Book Slot", exact: false },
                  { href: "/dashboard/booking-history", label: "Booking History", exact: false },
                  { href: "/dashboard/profile", label: "Profile", exact: false },
                ].map(({ href, label, exact }) => {
                  const active = exact ? pathname === href : pathname?.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-sm font-medium transition-colors ${
                        active ? "text-emerald-400" : "text-slate-300 hover:text-emerald-400"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </>
            ) : (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/#facilities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  Facilities
                </Link>
                <Link
                  href="/#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  Contact
                </Link>
                {user && (
                  <Link
                    href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {user.role === "ADMIN" ? "Admin Panel" : "Book Slots"}
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="pt-2 border-t border-slate-800">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">{user.name}</span>
                </div>
                <button
                  suppressHydrationWarning
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-1 text-xs font-medium text-rose-400 hover:text-rose-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                suppressHydrationWarning
                onClick={() => {
                  onOpenAuth?.();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center text-sm font-semibold bg-emerald-500 text-slate-950 py-2.5 rounded-lg"
              >
                Book Now
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
