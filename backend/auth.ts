import bcrypt from "bcryptjs";
import { AuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { prisma } from "@/backend/prisma";
import { loginSchema } from "@/backend/validations";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: parsed.data.username },
          include: {
            assignedStores: true,
          },
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(parsed.data.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          role: user.role,
          assignedStores: user.assignedStores.map((entry) => entry.storeId),
          pastDaysAllowed: user.pastDaysAllowed,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.assignedStores = user.assignedStores;
        token.pastDaysAllowed = user.pastDaysAllowed;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        username: token.username,
        role: token.role,
        assignedStores: token.assignedStores ?? [],
        pastDaysAllowed: token.pastDaysAllowed ?? null,
      };

      return session;
    },
  },
};

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    redirect("/stores");
  }

  return user;
}

export function canAccessStore(user: Awaited<ReturnType<typeof requireUser>>, storeId: string) {
  if (user.role === "OWNER") {
    return true;
  }

  return user.assignedStores.includes(storeId);
}
