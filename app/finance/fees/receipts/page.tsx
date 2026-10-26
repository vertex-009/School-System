import { redirect } from "next/navigation";

export default function FeeReceiptsListRedirect() {
  redirect("/finance/income-vs-expenses?tab=fees");
}
