import { corsair } from "@/server/corsair";
import { processWebhook } from "corsair";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const headerList = await headers();
    const headersObj: Record<string, string> = {};
    headerList.forEach((value, key) => {
      headersObj[key] = value;
    });

    const bodyText = await req.text();
    let body: unknown = bodyText;
    try {
      body = JSON.parse(bodyText);
    } catch {
      // Keep as string if not valid JSON
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId") || undefined;

    const result = await processWebhook(
      corsair,
      headersObj,
      body as Record<string, unknown> | string,
      tenantId ? { tenantId } : undefined,
    );

    return NextResponse.json(
      {
        success: true,
        plugin: result.plugin,
        action: result.action,
        response: result.response,
      },
      {
        status: 200,
        headers: result.responseHeaders,
      },
    );
  } catch (error: unknown) {
    console.error("[Webhook Error]:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    message: "Corsair webhook endpoint active",
  });
}
