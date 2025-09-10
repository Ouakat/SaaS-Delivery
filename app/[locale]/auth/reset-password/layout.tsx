import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Network Next Js",
  description: "Network is a popular dashboard template.",
};
const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
