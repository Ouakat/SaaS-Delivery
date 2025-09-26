import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parcels",
  description: "Parcels Page",
};
const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
