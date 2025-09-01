import LayoutProvider from "@/providers/layout.provider";
import LayoutContentProvider from "@/providers/content.provider";
import NetworkSidebar from "@/components/partials/sidebar";
import NetworkFooter from "@/components/partials/footer";
import ThemeCustomize from "@/components/partials/customizer";
import NetworkHeader from "@/components/partials/header";
const layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <LayoutProvider>
      <ThemeCustomize />
      <NetworkHeader />
      <NetworkSidebar />
      <LayoutContentProvider>{children}</LayoutContentProvider>
      <NetworkFooter />
    </LayoutProvider>
  );
};

export default layout;
