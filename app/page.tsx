"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ── Data ─────────────────────────────────────────────────────────────────────

const pills = [
  {
    icon: "📝",
    bg: "bg-blue-50 dark:bg-blue-950",
    title: "Fill the form once",
    desc: "Share your location, subjects, and availability",
  },
  {
    icon: "📞",
    bg: "bg-amber-50 dark:bg-amber-950",
    title: "We call you directly",
    desc: "When a nearby vacancy matches your profile",
  },
  {
    icon: "🏠",
    bg: "bg-green-50 dark:bg-green-950",
    title: "Start teaching nearby",
    desc: "Walk or commute — tuitions close to home",
  },
];

const contacts = [
  {
    icon: "📲",
    iconBg: "bg-blue-50 dark:bg-blue-950",
    label: "Primary Phone / WhatsApp",
    value: "9741660035 / 9769289209",
    href: "tel:+9779769289209",
  },
  {
    icon: "✉️",
    iconBg: "bg-green-50 dark:bg-green-950",
    label: "Email us",
    value: "gharmaishikshya@gmail.com",
    href: "mailto:gharmaishikshya@gmail.com",
  },
  {
    icon: "📍",
    iconBg: "bg-red-50 dark:bg-red-950",
    label: "Based in",
    value: "Pokhara, Gandaki Province",
    href: null,
  },
];

const stats = [
  { icon: "🎓", bg: "bg-blue-50 dark:bg-blue-950",  num: "100+",  label: "Tutors registered"  },
  { icon: "🏠", bg: "bg-green-50 dark:bg-green-950", num: "300+", label: "Vacancies fulfilled" },
  { icon: "⭐", bg: "bg-amber-50 dark:bg-amber-950", num: "4.8",   label: "Tutor satisfaction"  },
  { icon: "📍", bg: "bg-red-50 dark:bg-red-950",     num: "30+",   label: "Areas covered"       },
];

const trustItems = [
  "✅ Free to register — always",
  "📞 We call you when a match is found",
  "📍 Hyperlocal — tuitions near your home",
  "💰 Commission only on first month",
];

const areas = [
  "Lakeside", "Chipledhunga", "Mahendrapool", "New Road", "Bagar",
  "Prithvi Chowk", "Sabhagriha Chowk", "Buddha Chowk", "Amarsingh Chowk",
  "Deep Heights", "Matepani", "Birauta", "Birauta Chowk", "Kahukhola",
  "Shiva Chowk", "Hemja", "Bhandardhik", "Nagdhunga", "Sedi", "+ many more",
];

const steps = [
  "Your profile is added to our tutor database immediately.",
  "Our team monitors new home tuition vacancies every day.",
  "When a vacancy near your location opens up, we call or email you first.",
  "You decide if you want to take the tuition — no pressure.",
  "If you proceed, a small one-time commission (% of first month salary) applies.",
  "After that, the salary is entirely between you and the family.",
];

const baloo = {
  fontFamily: "'Baloo 2', sans-serif",
  fontStyle: "normal",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-blue-100 dark:border-blue-900 shadow-sm">
      <Link href="/" className="flex items-center gap-2 no-underline">
        <Image
          src="/tms/tms-logo.png"
          alt="Ghar Mai Shikshya"
          width={40}
          height={40}
          className="rounded-xl object-contain"
        />
        <div>
          <p
            className="font-extrabold text-[1rem] sm:text-[1.05rem] text-blue-700 dark:text-blue-400 leading-tight"
            style={baloo}
          >
            GharMai Shikshya
          </p>
          <p className="text-[0.58rem] sm:text-[0.62rem] font-semibold uppercase tracking-widest text-green-700 dark:text-green-400">
            Home Tuition Service
          </p>
        </div>
      </Link>

      <Button
        asChild
        size="sm"
        className="rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-md shadow-blue-200 dark:shadow-blue-900 gap-1.5 text-xs sm:text-sm px-3 sm:px-8 h-10"
        style={baloo}
      >
        <Link href="/teacher-form">
          <span className="text-base leading-none hidden sm:inline">+</span>
          Register as Tutor
        </Link>
      </Button>
    </nav>
  );
}

function ContactCard() {
  return (
    <Card
      id="contact"
      className="border border-blue-100 dark:border-blue-800 bg-white dark:bg-slate-800 shadow-xl shadow-blue-100/40 dark:shadow-blue-900/30 rounded-3xl overflow-hidden"
    >
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-green-500 to-amber-400" />
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-2xl flex-shrink-0">
          🏫
        </div>
        <div>
          <p className="font-bold text-[0.95rem] text-slate-800 dark:text-slate-100" style={baloo}>
            Get in touch with us
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            We're here to help you find the right tuition
          </p>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2.5">
        {contacts.map((c) =>
          c.href ? (
            <a
              key={c.label}
              href={c.href}
              className="flex items-center gap-3 px-3.5 py-3 bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-transparent hover:border-blue-100 dark:hover:border-blue-700 rounded-xl transition-all duration-200 no-underline group"
            >
              <div className={`w-8 h-8 ${c.iconBg} rounded-lg flex items-center justify-center text-base flex-shrink-0`}>
                {c.icon}
              </div>
              <div className="min-w-0">
                <span className="block text-[0.65rem] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  {c.label}
                </span>
                <span
                  className="block text-[0.82rem] font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate"
                  style={baloo}
                >
                  {c.value}
                </span>
              </div>
            </a>
          ) : (
            <div
              key={c.label}
              className="flex items-center gap-3 px-3.5 py-3 bg-slate-50 dark:bg-slate-700 border border-transparent rounded-xl"
            >
              <div className={`w-8 h-8 ${c.iconBg} rounded-lg flex items-center justify-center text-base flex-shrink-0`}>
                {c.icon}
              </div>
              <div className="min-w-0">
                <span className="block text-[0.65rem] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  {c.label}
                </span>
                <span
                  className="block text-[0.82rem] font-bold text-slate-800 dark:text-slate-200 truncate"
                  style={baloo}
                >
                  {c.value}
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </Card>
  );
}

function StatChips() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <Card
          key={s.label}
          className="border border-blue-100/80 dark:border-blue-800/60 bg-white dark:bg-slate-800 rounded-2xl shadow-sm"
        >
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 ${s.bg} rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0`}>
              {s.icon}
            </div>
            <div>
              <p
                className="text-[1.1rem] sm:text-[1.25rem] font-extrabold text-slate-800 dark:text-slate-100 leading-none"
                style={baloo}
              >
                {s.num}
              </p>
              <p className="text-[0.65rem] sm:text-[0.7rem] text-slate-400 dark:text-slate-500 mt-0.5">
                {s.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">

        {/* ── LEFT ── */}
        <div className="order-1">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-full text-[0.68rem] sm:text-[0.72rem] font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-4 sm:mb-5"
            style={baloo}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            Now accepting tutors in Pokhara Valley
          </div>

          {/* Headline */}
          <h1
            className="text-[2.2rem] sm:text-[2.8rem] md:text-[3.2rem] font-extrabold leading-[1.12] mb-4 text-slate-900 dark:text-white"
            style={baloo}
          >
            Teach from your{" "}
            <span className="text-green-600 dark:text-green-400">neighbourhood.</span>
            <br />
            <span className="text-blue-600 dark:text-blue-400">Earn every month.</span>
          </h1>

          {/* Description */}
          <p
            className="text-[0.95rem] sm:text-[1rem] leading-[1.8] text-slate-500 dark:text-slate-400 mb-6 max-w-[480px]"
            style={baloo}
          >
            Register once — we'll match you with home tuition vacancies near{" "}
            <strong className="text-slate-700 dark:text-slate-200">your area</strong>. You'll get a
            direct call or email whenever a student needs a tutor close to you.
            No fees. No hassle.
          </p>

          {/* How-it-works pills */}
          <div className="flex flex-col gap-2.5 sm:gap-3 mb-7 sm:mb-8">
            {pills.map((p) => (
              <div
                key={p.title}
                className="flex items-center gap-3 sm:gap-3.5 px-3.5 sm:px-4 py-3 bg-white dark:bg-slate-800 border border-blue-100/80 dark:border-blue-800/60 rounded-2xl shadow-sm hover:translate-x-1 hover:shadow-md transition-all duration-200"
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${p.bg} flex items-center justify-center text-lg sm:text-xl flex-shrink-0`}>
                  {p.icon}
                </div>
                <div>
                  <p
                    className="text-[0.82rem] sm:text-sm font-bold text-slate-800 dark:text-slate-100"
                    style={baloo}
                  >
                    {p.title}
                  </p>
                  <p className="text-[0.72rem] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-blue-600 text-xl hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-blue-900 gap-2 font-bold w-full sm:w-auto justify-center h-14"
              style={baloo}
            >
              <Link href="/teacher-form">
                Register as Tutor
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-2 text-xl h-14 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500 bg-transparent dark:bg-transparent font-bold w-full sm:w-auto justify-center"
              style={baloo}
            >
              <a href="#contact">📞 Call us first</a>
            </Button>
          </div>
        </div>

        {/* ── RIGHT — hidden on mobile, visible on lg ── */}
        <div className="order-last lg:order-2 flex flex-col gap-4 hidden lg:flex">
          <ContactCard />
          <StatChips />
        </div>
      </div>

      {/* ── Stats — mobile only ── */}
      <div className="lg:hidden mt-8">
        <StatChips />
      </div>

      {/* ── Contact card — mobile only ── */}
      <div className="lg:hidden mt-6">
        <ContactCard />
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <div className="bg-blue-600 dark:bg-blue-800 text-white py-3.5 sm:py-4 px-4 overflow-x-auto">
      <div className="flex items-center justify-start sm:justify-center gap-4 sm:gap-8 md:gap-12 min-w-max sm:min-w-0 mx-auto">
        {trustItems.map((t) => (
          <span
            key={t}
            className="text-[0.75rem] sm:text-sm font-semibold opacity-90 whitespace-nowrap"
            style={baloo}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function InfoSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
      {/* Areas */}
      <Card className="border border-blue-100 dark:border-blue-800 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <h3
            className="font-extrabold text-[1rem] sm:text-[1.1rem] text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2"
            style={baloo}
          >
            📍 Areas we currently serve
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4" style={baloo}>
            We actively place tutors across Pokhara Valley. If your area is
            listed below, there's a high chance of a vacancy near you very soon.
          </p>
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <span
                key={a}
                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-full text-[0.72rem] font-bold text-blue-600 dark:text-blue-400"
                style={baloo}
              >
                {a}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border border-blue-100 dark:border-blue-800 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <h3
            className="font-extrabold text-[1rem] sm:text-[1.1rem] text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2"
            style={baloo}
          >
            💡 What happens after you register?
          </h3>
          <ul className="flex flex-col gap-2 mt-3">
            {steps.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-slate-500 dark:text-slate-400"
                style={baloo}
              >
                <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold text-[0.7rem] flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

function FooterCTA() {
  return (
    <section className="bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500 dark:from-blue-950 dark:via-blue-900 dark:to-blue-800 text-white text-center py-14 sm:py-16 px-6">
      <h2
        className="text-[1.8rem] sm:text-[2rem] md:text-[2.4rem] font-extrabold mb-3"
        style={baloo}
      >
        Ready to start teaching?
      </h2>
      <p className="text-white/80 text-sm sm:text-base mb-7 max-w-md mx-auto" style={baloo}>
        Fill in your details once and let us bring home tuitions to your doorstep.
      </p>
      <Button
        asChild
        size="lg"
        className="rounded-full bg-white text-blue-700 hover:bg-blue-50 dark:bg-slate-100 dark:text-blue-800 dark:hover:bg-white font-bold shadow-xl shadow-blue-900/30 gap-2 w-full sm:w-auto"
        style={baloo}
      >
        <Link href="/teacher-form">
          📝 Fill the Registration Form
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </Button>
    </section>
  );
}

function FooterBottom() {
  return (
    <div
      className="text-center py-4 px-4 text-[0.75rem] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={baloo}
    >
      © 2025 Ghar Mai Shikshya · Pokhara, Nepal ·{" "}
      <a href="tel:+9779741660035" className="text-blue-600 dark:text-blue-400 hover:underline">
        9741660035/9769289209
      </a>{" "}
      ·{" "}
      <a href="mailto:gharmaishikshya@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
        gharmaishikshya@gmail.com
      </a>
    </div>
  );
}

function BgBlobs() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div className="absolute top-0 left-0 w-[70%] h-[55%] rounded-full bg-blue-100/50 dark:bg-blue-950/40 blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[55%] h-[50%] rounded-full bg-green-100/50 dark:bg-green-950/40 blur-3xl translate-x-1/3 translate-y-1/3" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-slate-900 overflow-x-hidden">
      <BgBlobs />
      <Navbar />
      <Hero />
      <TrustBar />
      <InfoSection />
      <FooterCTA />
      <FooterBottom />
    </div>
  );
}