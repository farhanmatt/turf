"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import {
  Shield,
  Activity,
  DollarSign,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  XCircle,
  CheckCircle,
  Save,
  Lock,
  Unlock,
  AlertCircle,
  Plus,
  LayoutDashboard,
  ClipboardList,
  Settings,
  CreditCard,
  CalendarCheck,
  Tag,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  BookOpen,
} from "lucide-react";

/* ─────────────────────────── types ─────────────────────────── */

interface Booking {
  id: string;
  date: string;
  startTime: number;
  endTime: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  referenceDetails: string | null;
  user: {
    name: string;
    phoneNumber: string;
  };
}

interface TurfSettings {
  openingTime: string;
  closingTime: string;
  pricePerHour: number;
  advancePaymentPercent: number;
  closedDays: string[];
  pricingRules: TimePricingRule[];
}

interface TimePricingRule {
  id?: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
}

type SidebarSection =
  | "overview"
  | "reservations"
  | "turf-settings"
  | "payment"
  | "availability"
  | "pricing-rules";

/* ─────────────────────────── nav config ─────────────────────── */

const NAV_ITEMS: {
  id: SidebarSection;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Dashboard & stats",
  },
  {
    id: "reservations",
    label: "Reservations",
    icon: ClipboardList,
    description: "Schedule log",
  },
  {
    id: "turf-settings",
    label: "Turf Settings",
    icon: Settings,
    description: "Times & pricing",
  },
  {
    id: "payment",
    label: "Payment Config",
    icon: CreditCard,
    description: "Advance payment",
  },
  {
    id: "availability",
    label: "Availability",
    icon: CalendarCheck,
    description: "Open / closed days",
  },
  {
    id: "pricing-rules",
    label: "Pricing Rules",
    icon: Tag,
    description: "Time-based rates",
  },
];

/* ─────────────────────────── component ─────────────────────── */

export default function AdminDashboard() {
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /* sidebar state */
  const [activeSection, setActiveSection] = useState<SidebarSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* admin login */
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  /* dashboard data */
  const [settings, setSettings] = useState<TurfSettings | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rollingDays, setRollingDays] = useState<string[]>([]);

  /* editable settings */
  const [openingTime, setOpeningTime] = useState("06:00");
  const [closingTime, setClosingTime] = useState("22:00");
  const [pricePerHour, setPricePerHour] = useState(500);
  const [closedDays, setClosedDays] = useState<string[]>([]);
  const [pricingRules, setPricingRules] = useState<TimePricingRule[]>([]);
  const [advancePaymentPercent, setAdvancePaymentPercent] = useState(50);

  /* loading / feedback */
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /* ── data fetching ── */
  const fetchAdminData = async () => {
    try {
      setLoadingData(true);
      setErrorMsg("");

      const bookingsRes = await fetch("/api/bookings?admin=true");
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.bookings);
      }

      const settingsRes = await fetch("/api/admin/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.settings);
        setOpeningTime(settingsData.settings.openingTime);
        setClosingTime(settingsData.settings.closingTime);
        setPricePerHour(settingsData.settings.pricePerHour);
        setAdvancePaymentPercent(settingsData.settings.advancePaymentPercent ?? 50);
        setClosedDays(Array.from(new Set<string>(settingsData.settings.closedDays || [])));
        setPricingRules(settingsData.settings.pricingRules || []);
      }

      const publicBookingsRes = await fetch("/api/bookings");
      if (publicBookingsRes.ok) {
        const publicBookingsData = await publicBookingsRes.json();
        setRollingDays(publicBookingsData.rollingDays);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
      setErrorMsg("Failed to retrieve system settings and schedules.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchAdminData();
    }
  }, [user]);

  /* ── handlers ── */
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoadingData(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Authentication failed.");
      } else {
        login(data.user);
        window.location.href = "/admin";
      }
    } catch {
      setErrorMsg("Failed to connect to login service.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingTime,
          closingTime,
          pricePerHour,
          closedDays,
          pricingRules,
          advancePaymentPercent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update configurations.");
      } else {
        setSuccessMsg("Configurations saved successfully!");
        setSettings(data.settings);
        setAdvancePaymentPercent(data.settings.advancePaymentPercent ?? 50);
        setClosedDays(Array.from(new Set<string>(data.settings.closedDays || [])));
        setPricingRules(data.settings.pricingRules || []);
      }
    } catch {
      setErrorMsg("Failed to connect to settings service.");
    }
  };

  const handleToggleClosedDay = (dateStr: string) => {
    setClosedDays((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : Array.from(new Set([...prev, dateStr]))
    );
  };

  const handleAddPricingRule = () => {
    setPricingRules((prev) => [...prev, { startTime: openingTime, endTime: closingTime, pricePerHour }]);
  };

  const handleUpdatePricingRule = (index: number, updates: Partial<TimePricingRule>) => {
    setPricingRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, ...updates } : rule)));
  };

  const handleRemovePricingRule = (index: number) => {
    setPricingRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to cancel booking.");
      } else {
        setSuccessMsg("Booking cancelled successfully.");
        await fetchAdminData();
      }
    } catch {
      setErrorMsg("Failed to cancel booking. Please try again.");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this booking?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to delete booking.");
      } else {
        setSuccessMsg("Booking record deleted successfully.");
        await fetchAdminData();
      }
    } catch {
      setErrorMsg("Failed to delete booking. Please try again.");
    }
  };

  /* ── helpers ── */
  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  /* ── loading state ── */
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex flex-1 items-center justify-center p-4">
          <Activity className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  /* ── guest / login view ── */
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="text-center space-y-1.5">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Shield className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">Admin Portal</h2>
              <p className="text-[11px] text-slate-400">
                Authenticate with administrator credentials to manage schedules
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-center space-x-2 rounded-lg bg-rose-950/40 border border-rose-800/80 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Username</label>
                <input
                  suppressHydrationWarning
                  type="text"
                  required
                  placeholder="admin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Password</label>
                <input
                  suppressHydrationWarning
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="bg-slate-950/60 rounded-lg border border-slate-800 p-3 text-[10px] text-slate-500 leading-relaxed">
                <strong>Dev Note:</strong> Default login is <code>admin</code> / <code>adminpassword</code>
              </div>
              <button
                suppressHydrationWarning
                type="submit"
                disabled={loadingData}
                className="w-full glow-btn bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition-transform active:scale-[0.98]"
              >
                {loadingData ? "Authenticating..." : "Admin Access Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── stats ── */
  const activeBookings = bookings.filter((b) => b.status !== "CANCELLED");
  const totalRevenue = activeBookings.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalSlotsCount = activeBookings.length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayBookingsCount = activeBookings.filter((b) => b.date === todayStr).length;

  /* ── section titles (for the page header) ── */
  const sectionMeta: Record<SidebarSection, { title: string; subtitle: string }> = {
    overview: { title: "Overview", subtitle: "Dashboard summary and key performance metrics" },
    reservations: { title: "Reservations & Schedule Log", subtitle: "View and manage all booking records" },
    "turf-settings": { title: "Turf Settings", subtitle: "Configure operating hours and base hourly pricing" },
    payment: { title: "Payment Configuration", subtitle: "Set the minimum advance payment percentage" },
    availability: { title: "Turf Availability", subtitle: "Mark days as open or closed for the next 7 days" },
    "pricing-rules": { title: "Time-Based Pricing Rules", subtitle: "Override pricing for specific time windows" },
  };

  const navigate = (section: SidebarSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
    setErrorMsg("");
    setSuccessMsg("");
  };

  /* ════════════════════════════════════════════════════════════ */
  /*  ADMIN VIEW                                                 */
  /* ════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 flex flex-col w-64
            bg-slate-950 border-r border-slate-800/70
            transition-transform duration-300 ease-in-out
            lg:static lg:translate-x-0 lg:z-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          style={{ top: "64px" }} /* below navbar height */
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/70">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white leading-none">Admin Panel</p>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-none">Management Console</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                    transition-all duration-150 group cursor-pointer
                    ${isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold leading-tight truncate ${isActive ? "text-emerald-300" : ""}`}>
                      {item.label}
                    </p>
                    <p className="text-[9px] text-slate-600 leading-tight truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  {isActive && <ChevronRight className="h-3 w-3 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="px-3 py-4 border-t border-slate-800/70 space-y-2">
            <button
              suppressHydrationWarning
              onClick={() => router.push("/dashboard")}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold px-3 py-2 rounded-lg text-[11px] transition-colors cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Switch to Booking Page
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">

          {/* Top bar (mobile hamburger + section title) */}
          <div className="sticky top-0 z-20 flex items-center gap-4 px-6 py-4 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">
                {sectionMeta[activeSection].title}
              </h1>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                {sectionMeta[activeSection].subtitle}
              </p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6 max-w-6xl">

            {/* Notices */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-800/80 p-4 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-800/80 p-4 text-xs text-emerald-300">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Loading spinner */}
            {loadingData ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Activity className="h-8 w-8 animate-spin text-emerald-500" />
                <span className="text-sm text-slate-400">Fetching configuration parameters...</span>
              </div>
            ) : (
              <>
                {/* ════════ OVERVIEW ════════ */}
                {activeSection === "overview" && (
                  <div className="space-y-6">
                    {/* Stat cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                          <DollarSign className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[10px] text-slate-500 uppercase font-semibold leading-tight">Total Revenue (Paid)</span>
                          <h3 className="text-xl font-bold text-white mt-1 truncate">₹{totalRevenue.toFixed(2)}</h3>
                        </div>
                      </div>
                      <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                          <CalendarIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[10px] text-slate-500 uppercase font-semibold leading-tight">Active Reservations</span>
                          <h3 className="text-xl font-bold text-white mt-1">{totalSlotsCount} Slots</h3>
                        </div>
                      </div>
                      <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                          <Clock className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[10px] text-slate-500 uppercase font-semibold leading-tight">Bookings Scheduled Today</span>
                          <h3 className="text-xl font-bold text-white mt-1">{todayBookingsCount} Reserved</h3>
                        </div>
                      </div>
                    </div>

                    {/* Quick-nav cards */}
                    <div>
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Access</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {NAV_ITEMS.filter((n) => n.id !== "overview").map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => navigate(item.id)}
                              className="glass-panel border border-slate-800/80 rounded-xl p-4 text-left flex items-center gap-3 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-150 group cursor-pointer"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-200 leading-tight">{item.label}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-emerald-400 ml-auto shrink-0 transition-colors" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Current settings snapshot */}
                    {settings && (
                      <div className="glass-panel border border-slate-800/80 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Current Configuration</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                            <p className="text-[9px] text-slate-500 uppercase font-semibold">Opening</p>
                            <p className="text-sm font-bold text-white mt-1">{settings.openingTime}</p>
                          </div>
                          <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                            <p className="text-[9px] text-slate-500 uppercase font-semibold">Closing</p>
                            <p className="text-sm font-bold text-white mt-1">{settings.closingTime}</p>
                          </div>
                          <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                            <p className="text-[9px] text-slate-500 uppercase font-semibold">Base Rate</p>
                            <p className="text-sm font-bold text-emerald-400 mt-1">₹{settings.pricePerHour}/hr</p>
                          </div>
                          <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                            <p className="text-[9px] text-slate-500 uppercase font-semibold">Advance</p>
                            <p className="text-sm font-bold text-amber-400 mt-1">{settings.advancePaymentPercent}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ════════ RESERVATIONS ════════ */}
                {activeSection === "reservations" && (
                  <div className="glass-panel border border-slate-800/80 rounded-2xl p-6">
                    {bookings.length === 0 ? (
                      <div className="text-center py-16 text-slate-500 text-xs">
                        No reservations logged in the system yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                              <th className="py-3 px-3 font-semibold whitespace-nowrap">User</th>
                              <th className="py-3 px-3 font-semibold whitespace-nowrap">Date</th>
                              <th className="py-3 px-3 font-semibold whitespace-nowrap">Timing</th>
                              <th className="py-3 px-3 font-semibold whitespace-nowrap text-right">Price</th>
                              <th className="py-3 px-3 font-semibold whitespace-nowrap text-right">Paid</th>
                              <th className="py-3 px-3 font-semibold whitespace-nowrap text-center">Status</th>
                              <th className="py-3 px-3 font-semibold whitespace-nowrap text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {bookings.map((booking) => {
                              const isCancelled = booking.status === "CANCELLED";
                              return (
                                <tr key={booking.id} className="hover:bg-slate-900/40 align-middle">
                                  <td className="py-3.5 px-3 whitespace-nowrap">
                                    <div className="font-bold text-white leading-tight">{booking.user.name}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{booking.user.phoneNumber}</div>
                                  </td>
                                  <td className="py-3.5 px-3 font-medium text-slate-300 whitespace-nowrap">
                                    {formatDateLabel(booking.date)}
                                  </td>
                                  <td className="py-3.5 px-3 font-medium text-slate-300 whitespace-nowrap">
                                    {formatHour(booking.startTime)} – {formatHour(booking.endTime)}
                                  </td>
                                  <td className="py-3.5 px-3 text-right font-semibold text-white whitespace-nowrap">
                                    ₹{booking.totalAmount}
                                  </td>
                                  <td className="py-3.5 px-3 text-right font-semibold text-emerald-400 whitespace-nowrap">
                                    ₹{booking.paidAmount}
                                  </td>
                                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                                        isCancelled
                                          ? "bg-rose-950/50 text-rose-400 border border-rose-900/30"
                                          : "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30"
                                      }`}
                                    >
                                      {booking.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3 whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-2">
                                      {!isCancelled && (
                                        <button
                                          suppressHydrationWarning
                                          onClick={() => handleCancelBooking(booking.id)}
                                          title="Cancel Booking"
                                          className="p-1.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:bg-rose-900 hover:text-white transition-colors cursor-pointer"
                                        >
                                          <XCircle className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                      <button
                                        suppressHydrationWarning
                                        onClick={() => handleDeleteBooking(booking.id)}
                                        title="Delete Record"
                                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ════════ TURF SETTINGS ════════ */}
                {activeSection === "turf-settings" && (
                  <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
                    <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 space-y-5">
                      {/* Operating times */}
                      <div>
                        <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Operating Hours</h2>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-400">Opening Time</label>
                            <select
                              value={openingTime}
                              onChange={(e) => setOpeningTime(e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                            >
                              {Array.from({ length: 24 }).map((_, i) => {
                                const hourStr = String(i).padStart(2, "0") + ":00";
                                return <option key={i} value={hourStr}>{formatHour(i)}</option>;
                              })}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-400">Closing Time</label>
                            <select
                              value={closingTime}
                              onChange={(e) => setClosingTime(e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                            >
                              {Array.from({ length: 24 }).map((_, i) => {
                                const hourStr = String(i).padStart(2, "0") + ":00";
                                return <option key={i} value={hourStr}>{formatHour(i)}</option>;
                              })}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Hourly rate */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400">Hourly Pricing (₹)</label>
                        <input
                          suppressHydrationWarning
                          type="number"
                          required
                          min={100}
                          value={pricePerHour}
                          onChange={(e) => setPricePerHour(parseInt(e.target.value, 10))}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-500">Base rate applied to all slots unless overridden by a pricing rule.</p>
                      </div>
                    </div>

                    <button
                      suppressHydrationWarning
                      type="submit"
                      className="flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold py-2.5 px-5 rounded-lg text-xs hover:bg-emerald-400 cursor-pointer transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Save Turf Settings
                    </button>
                  </form>
                )}

                {/* ════════ PAYMENT CONFIG ════════ */}
                {activeSection === "payment" && (
                  <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
                    <div className="glass-panel border border-amber-500/20 bg-amber-500/5 rounded-2xl p-6 space-y-5">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Payment Configuration</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Set the minimum advance percentage a user must pay to confirm a booking.
                        The remaining balance is collected on arrival.
                      </p>

                      {/* Preset pills */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-2">Quick Presets</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[25, 50, 75, 100].map((preset) => (
                            <button
                              suppressHydrationWarning
                              key={preset}
                              type="button"
                              onClick={() => setAdvancePaymentPercent(preset)}
                              className={`py-2.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                advancePaymentPercent === preset
                                  ? "bg-amber-500 text-slate-950 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                                  : "bg-slate-950 text-slate-400 border-slate-800 hover:border-amber-500/50 hover:text-amber-400"
                              }`}
                            >
                              {preset}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400">Custom Percentage</label>
                        <div className="relative flex items-center">
                          <input
                            suppressHydrationWarning
                            type="number"
                            min={1}
                            max={100}
                            value={advancePaymentPercent}
                            onChange={(e) => {
                              const v = Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1));
                              setAdvancePaymentPercent(v);
                            }}
                            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-3 pr-8 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                          />
                          <span className="absolute right-3 text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>

                      {/* Live preview */}
                      <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-2">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Live Preview — Example ₹1,000 Slot</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Minimum advance payment</span>
                          <span className="text-amber-400 font-bold">₹{Math.round(1000 * advancePaymentPercent / 100)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Remaining (due on arrival)</span>
                          <span className="text-slate-300 font-semibold">₹{Math.round(1000 * (100 - advancePaymentPercent) / 100)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      suppressHydrationWarning
                      type="submit"
                      className="flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold py-2.5 px-5 rounded-lg text-xs hover:bg-emerald-400 cursor-pointer transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Save Payment Configuration
                    </button>
                  </form>
                )}

                {/* ════════ AVAILABILITY ════════ */}
                {activeSection === "availability" && (
                  <form onSubmit={handleSaveSettings} className="space-y-6 max-w-lg">
                    <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 space-y-4">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Toggle the availability status for each day in the next 7 days.
                        Closed days will be completely unavailable for booking.
                      </p>
                      <div className="space-y-2">
                        {rollingDays.map((dateStr) => {
                          const isClosed = closedDays.includes(dateStr);
                          return (
                            <div
                              key={dateStr}
                              className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                                isClosed ? "bg-rose-950/10 border-rose-900/30" : "bg-emerald-950/10 border-emerald-900/20"
                              }`}
                            >
                              <span className="font-semibold text-slate-200">{formatDateLabel(dateStr)}</span>
                              <button
                                suppressHydrationWarning
                                type="button"
                                onClick={() => handleToggleClosedDay(dateStr)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                  isClosed
                                    ? "bg-rose-950/40 text-rose-400 border border-rose-900/50 hover:bg-rose-900/40"
                                    : "bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/40"
                                }`}
                              >
                                {isClosed ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                {isClosed ? "Closed" : "Open"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      suppressHydrationWarning
                      type="submit"
                      className="flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold py-2.5 px-5 rounded-lg text-xs hover:bg-emerald-400 cursor-pointer transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Save Availability
                    </button>
                  </form>
                )}

                {/* ════════ PRICING RULES ════════ */}
                {activeSection === "pricing-rules" && (
                  <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                    <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            Define custom rates for specific time windows. These override the base hourly price.
                          </p>
                        </div>
                        <button
                          suppressHydrationWarning
                          type="button"
                          onClick={handleAddPricingRule}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-[10px] font-bold uppercase text-emerald-400 hover:bg-emerald-950/60 cursor-pointer shrink-0 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Rule
                        </button>
                      </div>

                      {pricingRules.length === 0 ? (
                        <div className="text-center py-10 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                          No custom rules added yet. Base hourly pricing applies to all slots.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Column headers */}
                          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-1">
                            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Start Time</span>
                            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">End Time</span>
                            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Price / hr (₹)</span>
                            <span className="w-8" />
                          </div>
                          {pricingRules.map((rule, index) => (
                            <div
                              key={rule.id || `pricing-rule-${index}`}
                              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-2.5"
                            >
                              <select
                                value={rule.startTime}
                                onChange={(e) => handleUpdatePricingRule(index, { startTime: e.target.value })}
                                className="min-w-0 rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-[11px] text-slate-100 focus:border-emerald-500 focus:outline-none"
                              >
                                {Array.from({ length: 24 }).map((_, hour) => {
                                  const hourStr = String(hour).padStart(2, "0") + ":00";
                                  return <option key={hourStr} value={hourStr}>{formatHour(hour)}</option>;
                                })}
                              </select>
                              <select
                                value={rule.endTime}
                                onChange={(e) => handleUpdatePricingRule(index, { endTime: e.target.value })}
                                className="min-w-0 rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-[11px] text-slate-100 focus:border-emerald-500 focus:outline-none"
                              >
                                {Array.from({ length: 24 }).map((_, hour) => {
                                  const hourStr = String(hour).padStart(2, "0") + ":00";
                                  return <option key={hourStr} value={hourStr}>{formatHour(hour)}</option>;
                                })}
                              </select>
                              <input
                                suppressHydrationWarning
                                type="number"
                                min={1}
                                value={rule.pricePerHour}
                                onChange={(e) =>
                                  handleUpdatePricingRule(index, { pricePerHour: Number(e.target.value) })
                                }
                                className="min-w-0 rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-[11px] text-slate-100 focus:border-emerald-500 focus:outline-none"
                              />
                              <button
                                suppressHydrationWarning
                                type="button"
                                title="Remove pricing rule"
                                onClick={() => handleRemovePricingRule(index)}
                                className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-2 text-rose-400 hover:bg-rose-900 hover:text-white cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      suppressHydrationWarning
                      type="submit"
                      className="flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold py-2.5 px-5 rounded-lg text-xs hover:bg-emerald-400 cursor-pointer transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Save Pricing Rules
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
