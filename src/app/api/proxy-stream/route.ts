import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const cdnUrl = req.nextUrl.searchParams.get("url");
  const referer = req.nextUrl.searchParams.get("referer") || "";
  if (!cdnUrl) return new Response("url krävs", { status: 400 });

  const fetchHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  if (referer) fetchHeaders["Referer"] = referer;

  // Vidarebefordra Range-header för seeking-stöd
  const range = req.headers.get("range");
  if (range) fetchHeaders["Range"] = range;

  let upstream: Response;
  try {
    upstream = await fetch(cdnUrl, { headers: fetchHeaders });
  } catch {
    return new Response("Kunde inte ansluta till CDN", { status: 502 });
  }

  const responseHeaders: Record<string, string> = {
    "Content-Type": upstream.headers.get("Content-Type") || "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
  };

  const contentLength = upstream.headers.get("Content-Length");
  if (contentLength) responseHeaders["Content-Length"] = contentLength;

  const contentRange = upstream.headers.get("Content-Range");
  if (contentRange) responseHeaders["Content-Range"] = contentRange;

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
