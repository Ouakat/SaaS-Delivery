import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
  description: "Users Page",
};
const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
