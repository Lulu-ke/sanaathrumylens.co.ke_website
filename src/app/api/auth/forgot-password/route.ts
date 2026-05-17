import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { createTransport } from "nodemailer";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// POST: Send password reset email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    // Always return success to avoid revealing if email exists
    if (!user) {
      return NextResponse.json({ message: "If an account with that email exists, we've sent a reset link" });
    }

    // Generate a random token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to VerificationToken model
    await db.verificationToken.create({
      data: {
        identifier: `reset-password_${user.id}`,
        token,
        expires,
      },
    });

    // Try to send email
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass) {
      try {
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = process.env.SMTP_PORT;

        const transporter = createTransport({
          host: smtpHost,
          port: Number(smtpPort) || 587,
          secure: Number(smtpPort) === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const resetUrl = `https://sanaathrumylens.co.ke/auth/reset-password?token=${token}`;

        await transporter.sendMail({
          from: `"Sanaa Through My Lens" <${smtpUser}>`,
          to: email,
          subject: "Password Reset - Sanaa Through My Lens",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Sanaa Through My Lens</h2>
              <p>You requested a password reset. Click the link below to reset your password:</p>
              <div style="margin: 24px 0; text-align: center;">
                <a href="${resetUrl}" style="background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Reset Password</a>
              </div>
              <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
              <p style="color: #666; font-size: 14px;">Or copy this URL: ${resetUrl}</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
      }
    } else {
      // SMTP not configured — log token for dev
      console.log(`[DEV] Password reset token for ${email}: ${token}`);
      console.log(`[DEV] Reset URL: https://sanaathrumylens.co.ke/auth/reset-password?token=${token}`);
    }

    return NextResponse.json({ message: "If an account with that email exists, we've sent a reset link" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
