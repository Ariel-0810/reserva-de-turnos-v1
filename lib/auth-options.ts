// lib/auth-options.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Credenciales inválidas");
        }

        // 🔴 IMPORTS DINÁMICOS (ESTO SOLUCIONA TODO)
        const { ensureDb } = await import("@/lib/db-safe");
        const { User } = await import("@/lib/models/User");
        const { Business } = await import("@/lib/models/Business");

        await ensureDb();

        // Query manual sin asociaciones
        const user = await User.findOne({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Credenciales inválidas");
        }

        if (!user.password) {
          throw new Error("Esta cuenta usa Google");
        }

        // Allow login even without email verification
        // Users can verify later from dashboard
        if (!user.isEmailVerified) {
          console.log("⚠️ Usuario no verificado, permitiendo acceso temporal");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Credenciales inválidas");
        }

        // Obtener el negocio manualmente (sin asociaciones)
        const business = await Business.findOne({
          where: { userId: user.id },
        });

        // ✅ VERIFICAR SI EL NEGOCIO ESTÁ ACTIVO
        if (user.role === "BUSINESS_OWNER" && business) {
          if (!business.isActive) {
            throw new Error(
              "Tu negocio ha sido desactivado. Por favor contacta al administrador en g.a.gomez2016@gmail.com para más información."
            );
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: business?.id ?? null,
          businessIsActive: business?.isActive ?? true, // ✅ Guardar estado del negocio
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.businessId = (user as any).businessId;
        token.businessIsActive = (user as any).businessIsActive; // ✅ Guardar en token
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).businessId = token.businessId;
        (session.user as any).businessIsActive = token.businessIsActive; // ✅ Disponible en sesión
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
