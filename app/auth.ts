import { getServerSession, type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import YandexProvider from "next-auth/providers/yandex";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { validateTelegramData } from "@/lib/telegram";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const authOptions: NextAuthOptions = {
  debug: true,
  session: {
    strategy: "jwt",
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: requireEnv("GITHUB_ID"),
      clientSecret: requireEnv("GITHUB_SECRET"),
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
      allowDangerousEmailAccountLinking: true,
    }),
    YandexProvider({
      clientId: requireEnv("YANDEX_CLIENT_ID"),
      clientSecret: requireEnv("YANDEX_CLIENT_SECRET"),
      authorization: {
        params: {
          scope: "login:email login:info",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      id: "telegram",
      name: "Telegram",
      credentials: {
        id: { label: "id", type: "text" },
        first_name: { label: "first_name", type: "text" },
        last_name: { label: "last_name", type: "text" },
        username: { label: "username", type: "text" },
        photo_url: { label: "photo_url", type: "text" },
        auth_date: { label: "auth_date", type: "text" },
        hash: { label: "hash", type: "text" },
      },
      async authorize(credentials) {
        const botToken = requireEnv("TELEGRAM_BOT_TOKEN");
        const data = Object.fromEntries(Object.entries(credentials ?? {}).map(([k, v]) => [k, String(v ?? "")]));
        if (!validateTelegramData(data, botToken)) return null;
        const telegramId = data.id;
        const username = data.username;
        const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || username || "Telegram User";
        const image = data.photo_url || undefined;
        // Telegram не даёт email — сгенерируем стабильный псевдо-email
        const email = `${telegramId}@telegram.local`;
        // Найти/создать пользователя по этому email
        const user = await prisma.user.upsert({
          where: { email },
          update: { name, image },
          create: { email, name, image },
        });
        return { id: user.id, name: user.name ?? undefined, email: user.email ?? undefined, image: user.image ?? undefined } as any;
      },
    }),
  ],
  secret: requireEnv("NEXTAUTH_SECRET"),
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        console.log("[next-auth][jwt] provider:", account.provider);
        // запоминаем провайдера и картинку/имя из профиля
        (token as any).provider = account.provider;
      }
      if (profile) {
        if ((profile as any).picture || (profile as any).avatar) {
          (token as any).picture = (profile as any).picture || (profile as any).avatar;
        }
        if ((profile as any).name || (profile as any).display_name) {
          (token as any).name = (profile as any).name || (profile as any).display_name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[next-auth][session] user:", session?.user);
      if (session.user) {
        // прокидываем полезные поля в сессию для клиента
        if (token.sub) (session.user as any).id = token.sub;
        if ((token as any).provider) (session.user as any).provider = (token as any).provider;
        if ((token as any).picture && !session.user.image) session.user.image = (token as any).picture as string;
        if ((token as any).name && !session.user.name) session.user.name = (token as any).name as string;
      }
      return session;
    },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}