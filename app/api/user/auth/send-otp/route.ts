import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { send2FactorOTP } from "@/lib/smsService";
import crypto from "crypto";

const generateOTP = () => crypto.randomInt(100000, 999999).toString();
const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();
    const ip = req.headers.get("x-forwarded-for") || "Unknown IP";

    if (!phoneNumber || phoneNumber.length < 10) {
      return NextResponse.json(
        { error: "Valid phone number required" },
        { status: 400 },
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { phone: phoneNumber },
    });
    const isSignup = !user;

    // Rate limiting check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAttempts = await prisma.otpAttempt.count({
      where: {
        phoneNumber,
        createdAt: { gt: oneHourAgo },
      },
    });

    if (recentAttempts >= 3) {
      return NextResponse.json(
        { error: "Too many OTP requests. Try again later." },
        { status: 429 },
      );
    }

    // Generate OTP
    const otp = generateOTP();

    const otpHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Send OTP via 2Factor API
    let smsProvider = "console";
    let sessionId = null;
    const smsResult = await send2FactorOTP(phoneNumber, otp);
    const smsStatus = smsResult.success ? "sent" : "fallback";

    if (smsResult.success) {
      smsProvider = "2factor";
      sessionId = smsResult.sessionId;
    } else {
      // SMS delivery failed — log without exposing the OTP itself
      console.error(
        `[OTP-FALLBACK] SMS failed for +91***${phoneNumber.slice(-4)}`,
      );
    }

    // Store OTP attempt in database
    await prisma.otpAttempt.create({
      data: {
        phoneNumber,
        otpHash,
        expiresAt,
        ipAddress: ip,
        isSignup,
        sessionId,
        smsProvider,
        smsStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent",
      expiresIn: 300,
    });
  } catch (error: any) {
    console.error("🚨 Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
