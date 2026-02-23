import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchYtdlpMeta } from "@/lib/ytdlp";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { url } = body;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url krävs" }, { status: 400 });
  }

  try {
    const meta = await fetchYtdlpMeta(url);
    return NextResponse.json(meta);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ETIMEDOUT") || msg.includes("timed out") || msg.includes("timeout")) {
      return NextResponse.json({ error: "Timeout vid hämtning av metadata" }, { status: 504 });
    }
    return NextResponse.json({ error: msg || "Kunde inte hämta metadata" }, { status: 422 });
  }
}
