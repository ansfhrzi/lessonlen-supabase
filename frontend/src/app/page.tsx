import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";

export default async function HomePage() {
  const context = await getSessionContext();

  if (!context) redirect("/login");

  redirect(context.profile.role === "teacher" ? "/teacher" : "/student");
}
