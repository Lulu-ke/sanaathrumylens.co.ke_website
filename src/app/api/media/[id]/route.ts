import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { unlinkSync, existsSync } from "fs";
import { join } from "path";

// DELETE: Delete a media file by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "AUTHOR")) {
      return NextResponse.json({ error: "Forbidden — AUTHOR+ required" }, { status: 403 });
    }

    const { id } = await params;

    // Find the media record
    const media = await db.media.findUnique({ where: { id } });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Delete the physical file from public/uploads/
    if (media.url && media.url.startsWith("/uploads/")) {
      const filepath = join(process.cwd(), "public", media.url);
      if (existsSync(filepath)) {
        try {
          unlinkSync(filepath);
        } catch (fileError) {
          console.error("Failed to delete physical file:", fileError);
          // Continue with DB deletion even if file deletion fails
        }
      }
    }

    // Delete the database record
    await db.media.delete({ where: { id } });

    return NextResponse.json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("Delete media error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
