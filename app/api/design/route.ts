import { NextResponse } from "next/server";
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (typeof prompt !== "string" || prompt.trim().length < 8)
      return NextResponse.json(
        { error: "توضیح قطعه باید دست‌کم ۸ نویسه باشد." },
        { status: 400 },
      );
    const key = process.env.OPENAI_API_KEY;
    if (!key)
      return NextResponse.json(
        {
          error:
            "برای ساخت تصویر، OPENAI_API_KEY را در فایل .env.local تنظیم کنید.",
        },
        { status: 503 },
      );
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-2",
          prompt: `Editorial studio product photograph of a single handmade Iranian art ceramic object. ${prompt}. Neutral warm plaster background, soft daylight, centered full object, no text, no people, sophisticated tactile craft photography.`,
          size: "1024x1024",
          quality: "medium",
        }),
      },
    );
    const data = await response.json();
    if (!response.ok)
      return NextResponse.json(
        { error: data.error?.message || "سرویس ساخت تصویر پاسخ نداد." },
        { status: response.status },
      );
    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;
    if (!b64 && !url) throw new Error("No image returned");
    return NextResponse.json({
      image: b64 ? `data:image/png;base64,${b64}` : url,
    });
  } catch {
    return NextResponse.json(
      { error: "در ساخت تصویر مشکلی پیش آمد. دوباره تلاش کنید." },
      { status: 500 },
    );
  }
}
