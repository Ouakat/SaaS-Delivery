import LayoutProvider from "@/providers/layout.provider";
import LayoutContentProvider from "@/providers/content.provider";
import NetworkSidebar from "@/components/sidebar";
import NetworkFooter from "@/components/footer";
import ThemeCustomize from "@/components/customizer";
import NetworkHeader from "@/components/header";
import { ProtectedRoute } from "@/components/route/protected-route";

interface LayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

const ProtectedLayout = ({ children, params }: LayoutProps) => {
  return (
    <ProtectedRoute
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["INACTIVE", "PENDING_VALIDATION", "ACTIVE"]}
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
