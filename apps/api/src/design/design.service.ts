import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DesignService {
  constructor(private readonly config: ConfigService) {}

  async generate(prompt: string) {
    const key = this.config.get<string>("OPENAI_API_KEY");
    if (!key) {
      throw new HttpException(
        "برای ساخت تصویر، OPENAI_API_KEY را در فایل .env تنظیم کنید.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const response = await fetch("https://api.openai.com/v1/images/generations", {
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
    });
    const data = (await response.json()) as {
      error?: { message?: string };
      data?: Array<{ b64_json?: string; url?: string }>;
    };
    if (!response.ok) {
      throw new HttpException(
        data.error?.message || "سرویس ساخت تصویر پاسخ نداد.",
        response.status,
      );
    }
    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;
    if (!b64 && !url) {
      throw new HttpException("در ساخت تصویر مشکلی پیش آمد. دوباره تلاش کنید.", 500);
    }
    return { image: b64 ? `data:image/png;base64,${b64}` : url };
  }
}
