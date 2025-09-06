"use client";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { HeroUIProvider } from "@heroui/react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <HeroUIProvider>
      <SessionProvider>{children}</SessionProvider>
    </HeroUIProvider>
  );
}


