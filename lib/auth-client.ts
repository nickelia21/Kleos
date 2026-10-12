import { createAuthClient } from "better-auth/react";
import {
  genericOAuthClient,
  inferAdditionalFields,
  phoneNumberClient,
} from "better-auth/client/plugins";
import type { auth } from "./auth"; // type-only: erased at build, no server code in the bundle

export const authClient = createAuthClient({
  plugins: [
    phoneNumberClient(),
    genericOAuthClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});
