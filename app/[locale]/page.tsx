import { redirect } from "next/navigation";
import { cookies } from "next/headers";

interface RootPageProps {
  params: { locale: string };
  searchParams: { redirect?: string };
}

// Root page should redirect based on auth status
export default async function RootPage({
  params,
  searchParams,
}: RootPageProps) {
  const cookieStore = cookies();
  const authToken = cookieStore.get("auth_token");
  // console.log("🚀 ~ RootPage ~ authToken:", authToken)

  // Check if user is authenticated
  const isAuthenticated = authToken?.value && isTokenValid(authToken.value);
  // console.log("🚀 ~ RootPage ~ isAuthenticated:", isAuthenticated)

  if (isAuthenticated) {
    // Redirect authenticated users to dashboard or intended page
    const redirectTo = searchParams.redirect || "/dashboard";
    redirect(`/${params.locale}${redirectTo}`);
  } else {
    // Redirect unauthenticated users to login
    redirect(`/${params.locale}/auth/login`);
  }
}

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch {
    return false;
  }
}
