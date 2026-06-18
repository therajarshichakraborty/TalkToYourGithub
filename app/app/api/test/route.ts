import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function GET() {
    const result = await db.execute(sql`SELECT NOW()`);

    return NextResponse.json(result.rows);
}