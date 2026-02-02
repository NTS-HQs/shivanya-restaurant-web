import Link from "next/link";
import { getRestaurantProfile } from "@/lib/actions/menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Clock, UtensilsCrossed } from "lucide-react";

export default async function HomePage() {
  const profile = await getRestaurantProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Restaurant not configured yet.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden min-h-[40vh] flex items-center justify-center">
        {profile.bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.bannerImage}
            alt="Restaurant Banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 to-red-600/90" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-[url('/food-pattern.svg')] opacity-10" />

        <div className="relative px-4 py-8 text-center text-white">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-white/20 backdrop-blur rounded-full border border-white/20">
              <UtensilsCrossed className="w-5 h-5" />
              <span className="text-sm font-medium">Welcome to</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold mb-4 tracking-tight text-shadow-lg">
              {profile.name}
            </h1>

            <p className="text-lg sm:text-xl text-white/90 mb-4 font-medium">
              by {profile.ownerName}
            </p>

            <Badge
              variant={profile.isOpen ? "default" : "destructive"}
              className={`text-base px-6 py-2 ${
                profile.isOpen
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {profile.isOpen ? "🟢 Open Now" : "🔴 Closed"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 flex items-center gap-3 bg-white/95 backdrop-blur shadow-xl border-0">
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                Timings
              </p>
              <p className="font-semibold">
                {profile.openTime} - {profile.closeTime}
              </p>
            </div>
          </Card>

          <a href={`tel:${profile.contact}`} className="block">
            <Card className="p-4 flex items-center gap-3 bg-white/95 backdrop-blur shadow-xl border-0 hover:bg-green-50 transition-colors cursor-pointer group">
              <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Call Us
                </p>
                <p className="font-semibold">{profile.contact}</p>
              </div>
            </Card>
          </a>

          <Card className="p-4 flex items-center gap-3 bg-white/95 backdrop-blur shadow-xl border-0">
            <div className="p-3 bg-blue-100 rounded-full">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                Location
              </p>
              <p className="font-semibold text-sm line-clamp-1">
                {profile.address}
              </p>
            </div>
          </Card>
        </div>

        {/* Service Options */}
        <Card className="p-6 bg-white shadow-xl border-0 mb-8">
          <h2 className="text-xl font-bold mb-4 text-center">Our Services</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="text-3xl mb-2">🍽️</div>
              <p className="font-medium text-sm">Dine-In</p>
              <p className="text-xs text-muted-foreground">Scan & Order</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-3xl mb-2">🥡</div>
              <p className="font-medium text-sm">Take Away</p>
              <p className="text-xs text-muted-foreground">Quick Pickup</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-3xl mb-2">🚚</div>
              <p className="font-medium text-sm">Delivery</p>
              <p className="text-xs text-muted-foreground">At Your Door</p>
            </div>
          </div>
        </Card>

        {/* CTA Button */}
        <div className="text-center pb-12">
          <Link href="/menu">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-12 py-6 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              🍴 View Menu
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
