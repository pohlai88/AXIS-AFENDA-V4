import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: { message: "Afenda v1 API" }, error: null });
}
