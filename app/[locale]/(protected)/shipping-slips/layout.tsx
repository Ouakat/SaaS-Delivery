import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Slips",
  description: "Shipping Slips Page",
};
const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
