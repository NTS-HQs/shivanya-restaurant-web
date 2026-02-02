"use client";

import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  // Handle successful upload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onUpload = (result: any) => {
    if (result.info && result.info.secure_url) {
      onChange(result.info.secure_url);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Existing Image Preview */}
      {value && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 group">
          <div className="absolute top-2 right-2 z-10">
            <Button
              type="button"
              onClick={() => onChange("")}
              variant="destructive"
              size="icon"
              className="h-8 w-8 rounded-full shadow-md"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Upload"
            className="object-cover w-full h-full"
          />
        </div>
      )}

      {/* Upload Widget */}
      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        onSuccess={onUpload}
        options={{
          maxFiles: 1,
          resourceType: "image",
          clientAllowedFormats: ["image"],
        }}
      >
        {({ open }) => {
          const onClick = () => {
            if (open) {
              open();
            }
          };

          return (
            <div
              onClick={onClick}
              className={`
                relative cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-8
                flex flex-col items-center justify-center gap-3 text-center
                hover:border-orange-400 hover:bg-orange-50/50 transition-all
                ${disabled && "opacity-50 pointer-events-none"}
                ${!value ? "h-32" : "h-auto py-4 bg-slate-50"}
              `}
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-1">
                <ImagePlus className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">
                  {value ? "Change Image" : "Click to Upload Image"}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  JPEG, PNG, WebP (Max 5MB)
                </p>
              </div>
            </div>
          );
        }}
      </CldUploadWidget>

      {/* Warning if credentials missing */}
      {!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET && (
        <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg text-center">
          ⚠️ Missing Cloudinary Configuration
        </p>
      )}
    </div>
  );
}
