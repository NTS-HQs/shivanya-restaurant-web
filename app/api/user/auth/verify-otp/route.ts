import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verify2FactorOTP } from "@/lib/smsService";
import { signToken } from "@/lib/jwt";
import crypto from "crypto";

const prisma = new PrismaClient();

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export async function POST(req: Request) {
  try {
    const { phoneNumber, otp, name } = await req.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: "Phone number and OTP required" },
        { status: 400 }
      );
    }

    // Get the latest OTP attempt
    const otpRecord = await prisma.otpAttempt.findFirst({
      where: {
        phoneNumber,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "No valid OTP found or OTP expired" },
        { status: 400 }
      );
    }

    // Check OTP attempts
    if (otpRecord.attempts >= 3) {
      return NextResponse.json(
        { error: "Too many failed attempts" },
        { status: 400 }
      );
    }

    let otpVerified = false;
    let verificationMethod = "local";

    // Special access verification for specific phone number
    if (
      phoneNumber === "7426803221" &&
      otp === "1234" &&
      otpRecord.smsProvider === "special"
    ) {
      otpVerified = true;
      verificationMethod = "special";
    }
    // Try 2Factor verification first if session_id exists
    else if (otpRecord.sessionId && otpRecord.smsProvider === "2factor") {
      const factorResult = await verify2FactorOTP(otpRecord.sessionId, otp);

      if (factorResult.success) {
        otpVerified = true;
        verificationMethod = "2factor";
      }
    }

    // Fall back to local hash verification if 2Factor failed or not available
    if (!otpVerified) {
      const computedHash = hashToken(otp);

      if (otpRecord.otpHash === computedHash) {
        otpVerified = true;
        verificationMethod = "local";
      }
    }

    // Handle verification failure
    if (!otpVerified) {
      await prisma.otpAttempt.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Mark OTP as verified
    await prisma.otpAttempt.update({
      where: { id: otpRecord.id },
      data: {
        verifiedAt: new Date(),
        smsStatus: `verified_${verificationMethod}`,
      },
    });

    let user;
    let isNewUser = otpRecord.isSignup;

    if (isNewUser) {
      user = await prisma.user.create({
        data: {
          phone: phoneNumber,
          name: name || `User ${phoneNumber.slice(-4)}`,
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { phone: phoneNumber },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // Generate JWT tokens
    const accessToken = signToken(
      { userId: user.id, phone: phoneNumber, name: user.name, type: "access" },
      "15m"
    );

    const refreshToken = signToken(
      { userId: user.id, phone: phoneNumber, type: "refresh" },
      "7d"
    );

    return NextResponse.json({
      success: true,
      message: isNewUser ? "Signup successful" : "Login successful",
      isSignup: isNewUser,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
      user: {
        id: user.id,
        name: user.name,
        phone: phoneNumber,
        email: user.email,
        gender: user.gender,
        dob: user.dob,
        preference: user.preference,
        profile_image_url: user.profile_image_url,
      },
    });
  } catch (error: any) {
    console.error("🚨 Verify OTP error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
