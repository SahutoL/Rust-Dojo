import { DefaultSession } from "next-auth";

type SessionAdminRole = "ADMIN" | "EDITOR" | null;

declare module "next-auth" {
  interface User {
    adminRole?: SessionAdminRole;
  }

  interface Session {
    user: {
      id: string;
      adminRole: SessionAdminRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    adminRole?: SessionAdminRole;
  }
}
