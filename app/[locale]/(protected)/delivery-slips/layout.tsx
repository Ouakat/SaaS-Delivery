import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery Slips",
  description: "Delivery Slips Page",
};
const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
