"use client";

import { useEffect, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRestaurantProfile } from "@/lib/actions/menu";
import { updateRestaurantProfile } from "@/lib/actions/seller";
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
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Restaurant Settings</h1>

      {/* Open/Close Toggle */}
      <Card className="p-4 mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-bold">Restaurant Status</h3>
          <p className="text-sm text-muted-foreground">
            {profile.isOpen ? "Currently accepting orders" : "Currently closed"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleToggleOpen}
          disabled={isPending}
          className="gap-2"
        >
          {profile.isOpen ? (
            <>
              <ToggleRight className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-100 text-green-800">Open</Badge>
            </>
          ) : (
            <>
              <ToggleLeft className="w-8 h-8 text-gray-400" />
              <Badge variant="secondary">Closed</Badge>
            </>
          )}
        </Button>
      </Card>

      {/* Profile Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Restaurant Name
            </label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Owner Name
            </label>
            <Input
              value={profile.ownerName}
              onChange={(e) =>
                setProfile({ ...profile, ownerName: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Contact Number
            </label>
            <Input
              value={profile.contact}
              onChange={(e) =>
                setProfile({ ...profile, contact: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Address
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2 min-h-[80px]"
              value={profile.address}
              onChange={(e) =>
                setProfile({ ...profile, address: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Banner Image URL
            </label>
            <Input
              value={profile.bannerImage || ""}
              onChange={(e) =>
                setProfile({ ...profile, bannerImage: e.target.value })
              }
              placeholder="https://example.com/banner.jpg"
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
            <div>
              <label className="font-medium">Auto-Accept Orders</label>
              <p className="text-sm text-muted-foreground">
                Automatically accept all incoming orders
              </p>
            </div>
            <Button
              variant={profile.autoAccept ? "default" : "outline"}
              onClick={() =>
                setProfile({ ...profile, autoAccept: !profile.autoAccept })
              }
              className={
                profile.autoAccept ? "bg-green-600 hover:bg-green-700" : ""
              }
            >
              {profile.autoAccept ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Opening Time
              </label>
              <Input
                type="time"
                value={profile.openTime}
                onChange={(e) =>
                  setProfile({ ...profile, openTime: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Closing Time
              </label>
              <Input
                type="time"
                value={profile.closeTime}
                onChange={(e) =>
                  setProfile({ ...profile, closeTime: e.target.value })
                }
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
