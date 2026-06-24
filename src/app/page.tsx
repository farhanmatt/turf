"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import ScrollSequenceCanvas from "@/components/ScrollSequenceCanvas";
import { Calendar, Phone, Mail, MapPin, Clock, Award, Shield, Users, Coffee, Sparkles, ChevronRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const progress = scrollY / vh;
      setScrollProgress(progress);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openAuth = () => {
    setAuthModalOpen(true);
  };

  const amenities = [
    {
      icon: <Award className="h-6 w-6 text-emerald-400" />,
      title: "FIFA-Certified Grass",
      desc: "Premium shock-absorbent astroturf minimizing joint stress and injuries.",
    },
    {
      icon: <Clock className="h-6 w-6 text-emerald-400" />,
      title: "1000W LED Lighting",
      desc: "Stadium-grade floodlighting providing daylight clarity for night games.",
    },
    {
      icon: <Users className="h-6 w-6 text-emerald-400" />,
      title: "Modern Changing Rooms",
      desc: "Clean showers, private lockers, and changing amenities for teams.",
    },
    {
      icon: <Coffee className="h-6 w-6 text-emerald-400" />,
      title: "Refreshment Lounge",
      desc: "Spectator seating and snack kiosk serving sports drinks and snacks.",
    },
    {
      icon: <Shield className="h-6 w-6 text-emerald-400" />,
      title: "24/7 Security & CCTV",
      desc: "Fully secure complex with private parking and safe lockers.",
    },
    {
      icon: <Sparkles className="h-6 w-6 text-emerald-400" />,
      title: "Free High-Speed Wi-Fi",
      desc: "High-speed internet for spectators, live streaming, and tracking play stats.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <Navbar onOpenAuth={openAuth} />

      {/* Hero Section with Scroll Animation */}
      <section className="relative h-[200vh]">
        {/* Sticky Container for both Background and Content */}
        <div className="sticky top-0 h-screen w-full overflow-hidden border-b border-slate-900 z-0">
          {/* Background without Overlay */}
          <div className="absolute inset-0 z-0">
            <ScrollSequenceCanvas />
          </div>

          {/* Scrolling Content with Smooth Animation */}
          <div 
            className="absolute inset-0 flex flex-col justify-center items-center px-4 text-center z-10 pt-[10vh] pb-10"
            style={{
              opacity: Math.max(0, 1 - scrollProgress * 1.5),
              transform: `translateY(${scrollProgress * -100}px)`,
              transition: "opacity 0.2s ease-out, transform 0.2s ease-out"
            }}
          >
            <div className="relative max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Premium Sports Experience</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
                Arena Verde <br className="hidden sm:inline" />
                <span className="text-gradient-emerald">APEX TURF ARENA</span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                Experience premium-grade turf soccer and athletic grounds. Arena Verde features FIFA-certified artificial grass, high-lux LED floodlighting, and top-tier amenities designed for both casual play and professional tournaments.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                {user ? (
                  <Link
                    href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer"
                  >
                    <span>Go to Dashboard</span>
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                ) : (
                  <button
                    onClick={openAuth}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer"
                  >
                    <Calendar className="h-5 w-5" />
                    <span>Book Now</span>
                  </button>
                )}
              </div>
            </div>

            {/* Floating Quick Info */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl w-full mx-auto mt-16 px-4">
              <div className="flex items-center space-x-4 p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
                <Clock className="h-10 w-10 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Operating Hours</span>
                  <span className="text-sm font-bold text-white">06:00 AM - 10:00 PM</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
                <Award className="h-10 w-10 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Price Rate</span>
                  <span className="text-sm font-bold text-white">₹500 / Hour</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
                <Calendar className="h-10 w-10 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Booking Schedule</span>
                  <span className="text-sm font-bold text-white">7 Days Rolling Window</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities & Amenities Section */}
      <section id="facilities" className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              World-Class Facilities
            </h2>
            <p className="text-sm text-slate-400">
              Enjoy top-tier amenities built to deliver an exceptional playing environment for football, cricket, and multisport play.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {amenities.map((item, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-2xl border border-slate-900 bg-slate-900/30 hover:border-emerald-500/30 hover:bg-slate-900/50 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300 mb-5">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Info */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white">Find Us & Get in Touch</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Have questions about slot bookings, tournament rentals, or coaching packages? Our staff is here to help you get on the field.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Phone</span>
                    <span className="text-sm text-white font-medium">+91 98765 43210</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Email</span>
                    <span className="text-sm text-white font-medium">play@apexarena.com</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Location</span>
                    <span className="text-sm text-white font-medium">
                      123 Sports District Way, Near Central Stadium, Metro Area
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md space-y-4">
              <h3 className="text-lg font-bold text-white">Send a Message</h3>
              <form onSubmit={(e) => { e.preventDefault(); alert("Message sent successfully!"); }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="Your Email"
                      className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your query..."
                    className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="glow-btn bg-emerald-500 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-lg transition-transform active:scale-95"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Apex Turf Arena. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/admin" className="hover:text-emerald-400 font-semibold transition-colors">
              Staff Portal (Admin)
            </Link>
            <span className="text-slate-850">|</span>
            <span className="text-slate-500">Booking Terms & Conditions apply</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
