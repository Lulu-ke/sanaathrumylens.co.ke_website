import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
});

// POST: Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = subscribeSchema.parse(body);

    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      if (existing.status === "UNSUBSCRIBED") {
        await db.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", name: validated.name || existing.name },
        });
        return NextResponse.json({ message: "Resubscribed successfully" });
      }
      return NextResponse.json(
        { error: "Email is already subscribed" },
        { status: 409 }
      );
    }

    const token = uuidv4();

    await db.newsletterSubscriber.create({
      data: {
        email: validated.email,
        name: validated.name,
        token,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(
      { message: "Subscribed successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
