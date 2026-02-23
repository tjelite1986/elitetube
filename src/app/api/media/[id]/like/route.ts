import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = (await req.json()) as { action: "like" | "dislike" };
  const id = parseInt(params.id);
  const db = getDb();

  if (action === "like") {
    db.prepare("UPDATE media SET likes = likes + 1 WHERE id = ?").run(id);
  } else if (action === "dislike") {
    db.prepare("UPDATE media SET dislikes = dislikes + 1 WHERE id = ?").run(id);
  }

  const item = db
    .prepare("SELECT likes, dislikes FROM media WHERE id = ?")
    .get(id) as { likes: number; dislikes: number };

  return NextResponse.json(item);
}
