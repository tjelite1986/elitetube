import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const MEDIA_BASE = process.env.MEDIA_PATH || "/media";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thumbPath = path.join(MEDIA_BASE, "thumbnails", `${parseInt(params.id)}.jpg`);

  if (!fs.existsSync(thumbPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = fs.readFileSync(thumbPath);
  return new NextResponse(data, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "max-age=300, stale-while-revalidate=3600",
    },
  });
}
