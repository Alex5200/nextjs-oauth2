import Link from "next/link";
import { SinginButton } from "@/app/components/singin-button";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/react";
import { cookies } from "next/headers";
import { decryptUserCookie } from "@/lib/secure-cookie";
import { redirect } from "next/navigation";

export default async function Home() {
  const token = cookies().get("app.user")?.value;
  if (token && process.env.NEXTAUTH_SECRET) {
    try {
      await decryptUserCookie(token, process.env.NEXTAUTH_SECRET);
      redirect("/user-info");
    } catch {}
  }
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="flex justify-center">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">Sign in</h1>
            <p className="text-sm text-gray-500">to continue to your account</p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            <SinginButton />
          </div>
        </CardBody>
        <CardFooter className="justify-center">
          <Link href="/user-info" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
            Go to /user-info
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
