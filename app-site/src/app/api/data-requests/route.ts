import { NextResponse } from "next/server";
export async function POST(request: Request) { const form = await request.formData(); const origin = String(form.get("origin") ?? ""); const target = String(form.get("target") ?? ""); return NextResponse.json({ status: "request_recording_requires_database_binding", requested: { origin, target, indicator: "POP_DENSITY_KM2" } }, { status: 503 }); }
