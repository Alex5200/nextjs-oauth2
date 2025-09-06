import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/app/auth";
import { encryptUserCookie } from "@/lib/secure-cookie";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.redirect(new URL("/api/auth/signin", process.env.NEXTAUTH_URL));
  const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret";
  const token = await encryptUserCookie(
    {
      id: (session.user as any).id ?? null,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      image: (typeof session.user.image === "string" ? session.user.image : null) as any,
      provider: (session.user as any).provider ?? null,
    },
    secret,
  );
  cookies().set("app.user", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return NextResponse.redirect(new URL("/user-info", process.env.NEXTAUTH_URL));
}


