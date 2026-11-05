import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (token) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
