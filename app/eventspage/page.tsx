"use client";

import Link from "next/link";

const mediaItems = [
  { type: "img", src: "/media/img (2).jpeg" },
  { type: "video", src: "/media/srac_video (1).mp4" },
  { type: "img", src: "/media/img (3).jpeg" },
  { type: "img", src: "/media/img (4).jpeg" },
  { type: "video", src: "/media/srac_video (2).mp4" },
  { type: "img", src: "/media/img (5).jpeg" },
  { type: "video", src: "/media/srac_video (3).mp4" },
  { type: "img", src: "/media/img (6).jpeg" },
  { type: "video", src: "/media/srac_video (4).mp4" },
  { type: "img", src: "/media/img (7).jpeg" },
  { type: "img", src: "/media/img (8).jpeg" },
  { type: "img", src: "/media/img (9).jpeg" },
  { type: "img", src: "/media/img (10).jpeg" },
  { type: "video", src: "/media/srac_video (5).mp4" },
  { type: "img", src: "/media/img (11).jpeg" },
  { type: "img", src: "/media/img (12).jpeg" },
  { type: "img", src: "/media/img (13).jpeg" },
  { type: "img", src: "/media/img (14).jpeg" },
  { type: "video", src: "/media/srac_video (6).mp4" },
];

const eventTypes = [
  { label: "Doctor CMEs", color: "bg-blue-100" },
  { label: "Wedding", color: "bg-red-100" },
  { label: "Mehndi", color: "bg-amber-100" },
  { label: "Birthday", color: "bg-green-100" },
  { label: "Haldi", color: "bg-yellow-100" },
  { label: "Kitty Party", color: "bg-orange-100" },
  { label: "Corporate Parties", color: "bg-gray-200" },
];

const achievements = [
  {
    title: "Exclusive CME Caterers for Sharda Hospital",
    desc: "Recognised as the trusted catering partner delivering high-standard CME event services.",
  },
  {
    title: "Specialised in House-Warming Events (Without Onion & Garlic)",
    desc: "Providing pure-satvik, custom-designed menus for traditional home ceremonies.",
  },
  {
    title: "Successfully Conducted 800+ Parties",
    desc: "Proudly maintaining an exceptional customer satisfaction score of 4.987 across all events.",
  },
];

export default function EventsPage() {
  return (
    <main className="font-sans text-gray-800 bg-gray-50">
      {/* Back nav */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <Link
          href="/"
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          ← Back to Home
        </Link>
      </div>

      {/* ── Media Library ─────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-semibold text-gray-800 text-center mb-12 tracking-wide">
            Media Library
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {mediaItems.map((item, i) =>
              item.type === "img" ? (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow overflow-hidden border border-gray-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt="Gallery"
                    className="w-full h-60 object-cover hover:opacity-90 transition"
                  />
                </div>
              ) : (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow overflow-hidden border border-gray-200 group cursor-pointer"
                >
                  <video
                    src={item.src}
                    className="w-full h-60 object-cover group-hover:opacity-90 transition"
                    muted
                    autoPlay
                    playsInline
                    loop
                    onClick={(e) => {
                      const v = e.currentTarget;
                      v.paused ? v.play() : v.pause();
                    }}
                  />
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── Events We Host ────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto space-y-8">
          <h2 className="text-3xl font-semibold">Events We Host</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {eventTypes.map((ev) => (
              <div
                key={ev.label}
                className={`p-6 ${ev.color} rounded-2xl shadow text-center hover:shadow-lg transition`}
              >
                <h3 className="text-xl font-semibold">{ev.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Achievements ──────────────────────────────────────────────── */}
      <section className="bg-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-semibold text-gray-800 text-center mb-16 tracking-wide">
            Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {achievements.map((a) => (
              <div
                key={a.title}
                className="p-10 bg-white shadow rounded-xl border border-gray-200"
              >
                <h3 className="text-2xl font-semibold text-gray-700 mb-4 tracking-wide">
                  {a.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────── */}
      <section className="bg-white py-12">
        <div className="max-w-3xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6">
          <a
            href="https://wa.me/+919560232003"
            className="flex items-center gap-3 px-6 py-3 rounded-full shadow bg-green-100 hover:bg-green-200 transition w-full md:w-auto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/wa_icon.png"
              alt="WhatsApp"
              className="w-8 h-8 rounded-full"
            />
            <span className="font-semibold text-lg">WhatsApp</span>
          </a>
          <a
            href="https://www.instagram.com/"
            className="flex items-center gap-3 px-6 py-3 rounded-full shadow bg-pink-100 hover:bg-pink-200 transition w-full md:w-auto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/insta_icon.png"
              alt="Instagram"
              className="w-8 h-8 rounded-full"
            />
            <span className="font-semibold text-lg">Instagram</span>
          </a>
        </div>
      </section>
    </main>
  );
}
