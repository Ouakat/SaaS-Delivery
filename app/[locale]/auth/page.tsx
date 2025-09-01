import { redirect } from "next/navigation";

const page = ({ params: { locale } }: { params: { locale: string } }) => {
  redirect(`/${locale}/auth/login`);
};

export default page;
