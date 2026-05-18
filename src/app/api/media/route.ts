import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { uploadToCDN, isCDNUrl } from "@/lib/cdn";

// GET: List media (paginated)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
      db.media.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          uploader: { select: { id: true, name: true, username: true } },
        },
      }),
      db.media.count(),
    ]);

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List media error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Upload image to CDN (cdn.sanaathrumylens.co.ke)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "AUTHOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const altText = formData.get("altText") as string | null;
    const folder = (formData.get("folder") as string) || "misc";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG, AVIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 10MB" },
        { status: 400 }
      );
    }

    // Upload to CDN
    const cdnResult = await uploadToCDN(file, {
      folder: folder as 'posts' | 'artists' | 'events' | 'profiles' | 'ads' | 'misc',
    });

    // Create media record in database with CDN URL
    const media = await db.media.create({
      data: {
        filename: cdnResult.filename,
        originalName: cdnResult.originalName,
        mimeType: cdnResult.mimeType,
        size: cdnResult.size,
        url: cdnResult.url,
        altText,
        uploadedBy: session.user.id,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error("Upload media error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
