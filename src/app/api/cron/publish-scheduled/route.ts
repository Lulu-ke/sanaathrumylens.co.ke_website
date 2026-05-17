import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET: Publish scheduled posts whose time has come
// This endpoint is called by Vercel Cron
export async function GET(request: NextRequest) {
  // Verify CRON_KEY for security
  const authHeader = request.headers.get("authorization")
  const cronKey = process.env.CRON_KEY

  if (cronKey && authHeader !== `Bearer ${cronKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Find all posts that are SCHEDULED and scheduledAt <= now
  const postsToPublish = await db.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
    },
  })

  // Publish each one
  let published = 0
  for (const post of postsToPublish) {
    await db.post.update({
      where: { id: post.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    })
    published++
  }

  return NextResponse.json({ published, checked: postsToPublish.length })
}
