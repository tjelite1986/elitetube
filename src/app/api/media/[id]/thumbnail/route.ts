import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, MediaItem } from "@/lib/db";
import { generateThumbnail } from "@/lib/thumbnail";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = parseInt(params.id);
  const db = getDb();
  const item = db.prepare("SELECT * FROM media WHERE id = ?").get(id) as MediaItem | undefined;

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!item.filename) return NextResponse.json({ error: "No local file" }, { status: 400 });
  if (item.type === "image") return NextResponse.json({ error: "Images do not need thumbnails" }, { status: 400 });

  const url = await generateThumbnail(id);
  if (!url) {
    return NextResponse.json({ error: "ffmpeg could not generate thumbnail" }, { status: 500 });
  }

  return NextResponse.json({ url });
}
