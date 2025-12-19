import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to login page - in production this would check auth status
  redirect("/dashboard");
}
