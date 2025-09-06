"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function SessionLogger() {
  const { data, status } = useSession();

  useEffect(() => {
    // Логируем статус и данные сессии в браузерную консоль
    // Это поможет убедиться, что данные получены и доступны на клиенте
    console.log("session status:", status);
    console.log("session data:", data);
  }, [status, data]);

  return null;
}


