import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { dbRepository } from "@/lib/db/client";
import { isSameOrigin } from "@/lib/auth/origin";

export async function GET() {
  const session = await getCurrentSession();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = dbRepository.getPreferences(session.user.id);
  return NextResponse.json({ preferences });
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = await getCurrentSession();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body?.widget_config === "string") {
      if (body.widget_config.length > 2000) return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
      const config = JSON.parse(body.widget_config);
      if (!config || typeof config !== "object" || Array.isArray(config)) return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
    }
    const allowed = ["theme", "glass", "locale", "density", "accent_color", "sidebar_collapsed", "widget_config"];
    const updateData: Record<string, string | number> = {};

    for (const key of allowed) {
      if (key in body) {
        updateData[key] = body[key];
      }
    }

    const updated = dbRepository.updatePreferences(session.user.id, updateData);
    return NextResponse.json({ preferences: updated });
  } catch (err) {
    console.error("Failed to update preferences:", err);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
