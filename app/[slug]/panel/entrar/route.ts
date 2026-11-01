import { NextResponse, type NextRequest } from "next/server";
import { getLocal } from "@/lib/datos";
import { entrarDueno } from "@/lib/auth";

// Link mágico para el dueño: /<slug>/panel/entrar?k=<clave>
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const local = await getLocal(slug);
  const ok = local ? await entrarDueno(local, req.nextUrl.searchParams.get("k") ?? "") : false;
  return NextResponse.redirect(new URL(`/${slug}/panel${ok ? "" : "?error=1"}`, req.url));
}
