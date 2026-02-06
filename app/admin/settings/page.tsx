"use client";

import { useEffect, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRestaurantProfile } from "@/lib/actions/menu";
import { updateRestaurantProfile } from "@/lib/actions/seller";
import { ImageUpload } from "@/components/ui/image-upload";
import { Save, Loader2, ToggleLeft, ToggleRight } from "lucide-react";

type Profile = Awaited<ReturnType<typeof getRestaurantProfile>>;

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getRestaurantProfile().then(setProfile);
  }, []);

  const handleSave = () => {
    if (!profile) return;

    startTransition(async () => {
      await updateRestaurantProfile({
        name: profile.name,
        ownerName: profile.ownerName,
        contact: profile.contact,
        address: profile.address,
        bannerImage: profile.bannerImage || undefined,
        autoAccept: profile.autoAccept,
        openTime: profile.openTime,
        closeTime: profile.closeTime,
        isOpen: profile.isOpen,
        paymentQrCode: profile.paymentQrCode || undefined,
        upiId: profile.upiId || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleToggleOpen = () => {
    if (!profile) return;
    const newStatus = !profile.isOpen;
    setProfile({ ...profile, isOpen: newStatus });

    startTransition(async () => {
      await updateRestaurantProfile({ isOpen: newStatus });
    });
  };

  if (!profile) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-slate-500 mt-2">
            Manage your restaurant profile and operating hours
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isPending || saved}
          size="lg"
          className={`
            min-w-[140px] font-semibold shadow-md transition-all
            ${
              saved
                ? "bg-green-600 hover:bg-green-700"
                : "bg-slate-900 hover:bg-slate-800"
            }
          `}
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : saved ? (
            <span className="flex items-center">
              <Save className="w-5 h-5 mr-2" /> Saved
            </span>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Brand & Profile Identiy */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border border-slate-200 shadow-sm bg-white">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-4">
              Restaurant Identity
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Display Name
                </label>
                <Input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  placeholder="e.g. Shivanya Restaurant"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Owner Name
                </label>
                <Input
                  value={profile.ownerName}
                  onChange={(e) =>
                    setProfile({ ...profile, ownerName: e.target.value })
                  }
                  placeholder="e.g. Swapnil Sharma"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Contact Number
                </label>
                <Input
                  value={profile.contact}
                  onChange={(e) =>
                    setProfile({ ...profile, contact: e.target.value })
                  }
                  placeholder="+91 98765 43210"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Restaurant Banner
                </label>
                <ImageUpload
                  value={profile.bannerImage || ""}
                  onChange={(url) =>
                    setProfile({ ...profile, bannerImage: url })
                  }
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Physical Address
                </label>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all resize-y text-sm"
                  value={profile.address}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                  placeholder="Complete street address for delivery purposes"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Operations & Status */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card
            className={`p-6 border shadow-sm transition-all ${
              profile.isOpen
                ? "bg-green-50 border-green-100"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Store Status
              </h2>
              <Badge
                variant={profile.isOpen ? "default" : "secondary"}
                className={
                  profile.isOpen ? "bg-green-600 hover:bg-green-700" : ""
                }
              >
                {profile.isOpen ? "OPEN" : "CLOSED"}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              {profile.isOpen
                ? "Your store is currently online and accepting orders."
                : "Your store is offline. Customers cannot place orders."}
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={handleToggleOpen}
              disabled={isPending}
              className={`w-full font-bold border-2 ${
                profile.isOpen
                  ? "border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {profile.isOpen ? (
                <span className="flex items-center gap-2">
                  <ToggleRight className="w-5 h-5" /> Switch to Offline
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ToggleLeft className="w-5 h-5 text-slate-400" /> Switch to
                  Online
                </span>
              )}
            </Button>
          </Card>

          {/* Operations Card */}
          <Card className="p-6 border border-slate-200 shadow-sm bg-white">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Operations
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Payment QR Code (Static Image)
                </label>
                <ImageUpload
                  value={profile.paymentQrCode || ""}
                  onChange={(url) =>
                    setProfile({ ...profile, paymentQrCode: url })
                  }
                />
                <p className="text-xs text-slate-500">
                  Upload your GPay/PhonePe QR code screenshot here.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  UPI ID (VPA)
                </label>
                <Input
                  value={profile.upiId || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, upiId: e.target.value })
                  }
                  placeholder="e.g. merchant@oksbi"
                  className="bg-slate-50 border-slate-200"
                />
                <p className="text-xs text-slate-500">
                  Enter your VPA to enable "Pay with UPI App" button.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <span className="font-medium text-sm text-slate-900 block">
                    Auto-Accept Orders
                  </span>
                  <span className="text-xs text-slate-500">
                    Skip manual approval
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={profile.autoAccept ? "default" : "outline"}
                  onClick={() =>
                    setProfile({ ...profile, autoAccept: !profile.autoAccept })
                  }
                  className={
                    profile.autoAccept
                      ? "bg-blue-600 hover:bg-blue-700 h-8"
                      : "h-8"
                  }
                >
                  {profile.autoAccept ? "On" : "Off"}
                </Button>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 block border-b border-slate-100 pb-2">
                  Business Hours
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                      Opens At
                    </span>
                    <Input
                      type="time"
                      value={profile.openTime}
                      onChange={(e) =>
                        setProfile({ ...profile, openTime: e.target.value })
                      }
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                      Closes At
                    </span>
                    <Input
                      type="time"
                      value={profile.closeTime}
                      onChange={(e) =>
                        setProfile({ ...profile, closeTime: e.target.value })
                      }
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
