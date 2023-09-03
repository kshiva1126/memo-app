import { LoaderArgs } from "@remix-run/cloudflare";
import { getAuthenticator } from "~/features/common/services/auth.server";

export async function loader({ request, context }: LoaderArgs) {
  const authenticator = getAuthenticator(context);
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/",
  });
}
