import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectedReason: z.string().optional(),
});

// POST: Submit for review (author)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only the author can submit for review
    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: "Only the author can submit for review" }, { status: 403 });
    }

    if (post.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft posts can be submitted for review" },
        { status: 400 }
      );
    }

    const updatedPost = await db.post.update({
      where: { id },
      data: { status: "PENDING_REVIEW" },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Submit for review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Approve/Reject post (editor, admin, super_admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "EDITOR")) {
      return NextResponse.json({ error: "Forbidden — Editor role required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = reviewSchema.parse(body);

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "Post is not pending review" },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown>;

    if (validated.action === "approve") {
      updateData = {
        status: "APPROVED",
        reviewedById: session.user.id,
      };
    } else {
      if (!validated.rejectedReason) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }
      updateData = {
        status: "REJECTED",
        reviewedById: session.user.id,
        rejectedReason: validated.rejectedReason,
      };
    }

    const updatedPost = await db.post.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Review post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
