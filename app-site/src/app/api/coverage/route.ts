import { NextResponse } from "next/server";
import { getRuntimeRepositories } from "@/server/database";

export async function GET() {
  const repositories = await getRuntimeRepositories();
  return NextResponse.json(await repositories.registry.getCoverage());
}
