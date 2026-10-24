import { redirect } from "next/navigation";

/** Financial reports hub removed from sidebar. */
export default function FinancialReportsRedirect() {
  redirect("/finance");
}
