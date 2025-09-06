"use client"
import { signIn, signOut } from "next-auth/react";
import { Button } from "@heroui/react";

export const SinginButton = () => {
  return (
    <div className="flex flex-col gap-2">
      <Button variant="bordered" onPress={() => signIn("github", { callbackUrl: "/user-info" })}>
        Continue with GitHub
      </Button>
      <Button variant="bordered" onPress={() => signIn("google", { callbackUrl: "/user-info" })}>
        Continue with Google
      </Button>
      <Button variant="bordered" onPress={() => signIn("yandex", { callbackUrl: "/user-info" })}>
        Continue with Yandex
      </Button>
    </div>
  );
};

export const SignoutButton = () => {
  return <Button variant="bordered" onPress={async () => {
    // Сначала очищаем наш cookie пользователя
    await fetch("/api/auth/logout");
    await signOut({ callbackUrl: "/" });
  }}>Sign out</Button>;
};