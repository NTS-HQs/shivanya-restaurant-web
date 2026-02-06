import Link from "next/link";
import { getRestaurantProfile } from "@/lib/actions/menu";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import {
  Phone,
  MapPin,
  Clock,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default async function HomePage() {
  const profile = await getRestaurantProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Construction in Progress 🚧
          </h1>
          <p className="text-slate-500">
            The restaurant profile is missing. Please set it up in the admin
            panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FD] p-4 sm:p-6 lg:p-10 font-sans selection:bg-orange-100 overflow-x-hidden">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 1. Header Minimal */}
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-200">
              S
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">
              {profile.name}
            </span>
          </div>
          <Badge
            variant="outline"
            className={`rounded-full px-4 py-1.5 border-0 font-bold ${
              profile.isOpen
                ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                : "bg-red-100 text-red-700 ring-1 ring-red-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-2 ${
                profile.isOpen ? "bg-green-600 animate-pulse" : "bg-red-600"
              }`}
            />
            {profile.isOpen ? "Open Now" : "Closed"}
          </Badge>
        </header>

        {/* 2. Hero Section - Mobile First */}
        <div className="relative h-[40vh] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200 group">
          {profile.bannerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.bannerImage}
              alt="Restaurant Banner"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
              <span className="text-4xl">🍕</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <h1 className="text-4xl sm:text-5xl font-black mb-2 leading-tight">
              Delicious Food, <br />
              <span className="text-orange-400">Straight to You.</span>
            </h1>
            <p className="text-white/80 font-medium max-w-md">
              Experience the authentic flavors. Fresh ingredients, made with
              love.
            </p>
          </div>
        </div>

        {/* 3. Service Grid - The Core */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 relative">
          {/* Ambient Background Blobs for specific Liquid Effect */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-orange-300/30 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
          <div className="absolute top-10 right-10 w-72 h-72 bg-blue-300/30 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
          <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-purple-300/30 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

          {/* Main Action: Dine-In */}
          <Link
            href="/menu?type=dine_in"
            className="col-span-1 md:col-span-8 group block h-full relative z-10"
          >
            <div
              className="h-full min-h-[160px] sm:min-h-[280px] rounded-[2rem] p-4 sm:p-10 overflow-hidden relative transition-all hover:scale-[1.01] flex flex-col justify-between
                          bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-200/50"
            >
              {/* Glossy Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-white/50 backdrop-blur-md w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-sm border border-white/60">
                    <UtensilsCrossed className="w-5 h-5 sm:w-7 sm:h-7 text-slate-700" />
                  </div>
                  <div className="bg-white/40 rounded-full p-1.5 sm:p-2 group-hover:bg-white/80 transition-colors border border-white/50">
                    <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 text-slate-600 -rotate-45" />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl sm:text-4xl font-black mb-1 leading-tight tracking-tight text-slate-800">
                    Dine-In
                  </h2>
                  <p className="text-slate-500 font-medium text-xs sm:text-lg leading-relaxed max-w-sm hidden sm:block">
                    Scan the QR code on your table to browse our digital menu.
                  </p>
                  <p className="text-slate-500 font-medium text-[10px] sm:hidden leading-tight">
                    Order at Table
                  </p>

                  {/* Premium CTA Button - Dark Glass Style */}
                  <div className="mt-3 inline-flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide shadow-lg shadow-slate-300/20 transition-all group-hover:scale-105 group-hover:shadow-slate-300/40 w-fit border border-white/10">
                    <span>Browse Menu</span>
                    <ArrowRight className="w-4 h-4 text-white/90" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Secondary Actions: Looking Glass Stack */}
          <div className="col-span-1 md:col-span-4 flex flex-col gap-3 sm:gap-4 h-full relative z-10">
            <Link href="/menu?type=takeaway" className="flex-1 block group">
              <BentoCard
                title="Takeaway"
                icon={
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
                }
                className="h-full flex flex-col justify-between p-4 sm:p-6 min-h-[74px]
                               bg-white/40 backdrop-blur-xl border border-white/50 shadow-lg shadow-slate-200/40 hover:bg-white/60 transition-colors"
                active={false}
              >
                <div className="mt-1 sm:mt-2 text-right">
                  <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Pickup
                  </p>
                </div>
              </BentoCard>
            </Link>

            <Link href="/menu?type=delivery" className="flex-1 block group">
              <BentoCard
                title="Delivery"
                icon={
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
                }
                className="h-full flex flex-col justify-between p-4 sm:p-6 min-h-[74px]
                               bg-white/40 backdrop-blur-xl border border-white/50 shadow-lg shadow-slate-200/40 hover:bg-white/60 transition-colors"
                active={false}
              >
                <div className="mt-1 sm:mt-2 text-right">
                  <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Doorstep
                  </p>
                </div>
              </BentoCard>
            </Link>
          </div>
        </div>

        {/* 4. Minimalist Info Dock */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col items-stretch sm:flex-row sm:items-center justify-between gap-6 overflow-hidden relative">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">
                Opening Hours
              </p>
              <p className="font-bold text-slate-900">
                {profile.openTime} - {profile.closeTime}
              </p>
            </div>
          </div>

          <div className="hidden sm:block w-px h-10 bg-slate-100"></div>
          <div className="block sm:hidden h-px w-full bg-slate-100"></div>

          <a
            href={`tel:${profile.contact}`}
            className="flex items-center gap-4 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase group-hover:text-green-600 transition-colors">
                Call Us
              </p>
              <p className="font-bold text-slate-900">{profile.contact}</p>
            </div>
          </a>

          <div className="hidden sm:block w-px h-10 bg-slate-100"></div>
          <div className="block sm:hidden h-px w-full bg-slate-100"></div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">
                Location
              </p>
              <p className="font-bold text-slate-900 line-clamp-1 max-w-[200px]">
                {profile.address.split(",")[0]}
              </p>
            </div>
          </div>

          {/* Subtle pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-16 -mt-16 z-0 opacity-50 pointer-events-none" />
        </div>

        <footer className="pt-8 pb-4 text-center space-y-2">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Developed by{" "}
            <a
              href="https://www.nagarjunatechsolutions.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600 transition-colors inline-flex items-center gap-1"
            >
              Nagarjuna tech solutions Pvt Ltd
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </p>
          <p className="text-slate-400 text-sm font-medium">
            © {new Date().getFullYear()} {profile.name}. All rights reserved.
          </p>
      
        </footer>
      </div>
    </main>
  );
}
