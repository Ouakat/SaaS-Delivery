import LayoutProvider from "@/providers/layout.provider";
import LayoutContentProvider from "@/providers/content.provider";
import NetworkSidebar from "@/components/partials/sidebar";
import NetworkFooter from "@/components/partials/footer";
import ThemeCustomize from "@/components/partials/customizer";
import NetworkHeader from "@/components/partials/header";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface LayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

const ProtectedLayout = ({ children, params }: LayoutProps) => {
  return (
    <ProtectedRoute
      requireAuth={true}
      requireTenant={true}
      // Optional: Add role or user type restrictions
      // allowedRoles={["admin", "manager", "support"]}
      // allowedUserTypes={["ADMIN", "MANAGER", "SUPPORT", "SELLER", "LIVREUR"]}
    >
      <LayoutProvider>
        <ThemeCustomize />
        <NetworkHeader />
        <NetworkSidebar />
        <LayoutContentProvider>{children}</LayoutContentProvider>
        <NetworkFooter />
      </LayoutProvider>
    </ProtectedRoute>
  );
};

export default ProtectedLayout;
