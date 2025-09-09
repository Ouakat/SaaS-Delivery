import LoginPage from "./auth/login/page";

// This is the root page - it will show login if not authenticated
export default function RootPage({ params }: { params: { locale: string } }) {
  // For now, just render the login page
  // Later you can add logic to check auth status server-side
  return <LoginPage params={params} />;
}

// Optional: Add metadata
export const metadata = {
  title: "Network - Sign In",
  description: "Sign in to your Network account",
};
