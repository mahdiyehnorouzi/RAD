import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  const response = await fetch(
    `${process.env.API_URL || "http://localhost:4000"}/design`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    },
  );
  return NextResponse.json(await response.json(), { status: response.status });
}
