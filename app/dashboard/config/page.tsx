// app\dashboard\config\page.tsx  
import { redirect } from "next/navigation"

export default function ConfigRedirectPage() {
  redirect("/dashboard/settings")
}
