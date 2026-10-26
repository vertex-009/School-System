import { redirect } from "next/navigation";

export default function FeeRecordsRedirect() {
  redirect("/finance/income-vs-expenses?tab=fees");
}
