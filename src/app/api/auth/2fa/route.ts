import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}

// POST: Verify 2FA OTP code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateKey = `2fa_${session.user.id}`;
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.twoFactorCode || !user.twoFactorExp) {
      return NextResponse.json(
        { error: "No verification code was sent. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if code expired
    if (new Date() > user.twoFactorExp) {
      await db.user.update({
        where: { id: user.id },
        data: { twoFactorCode: null, twoFactorExp: null },
      });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if code matches
    if (user.twoFactorCode !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Mark as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: null,
        twoFactorExp: null,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({ message: "Verification successful" });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
