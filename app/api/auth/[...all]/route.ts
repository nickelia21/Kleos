import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// All better-auth endpoints (sign-in/out, OAuth callbacks, verification,
// password reset, phone OTP, account linking) mount here.
export const { GET, POST } = toNextJsHandler(auth);
