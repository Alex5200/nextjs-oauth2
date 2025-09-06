import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  cookies().delete("app.user");
  return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL));
}


