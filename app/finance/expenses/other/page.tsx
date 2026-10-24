import { redirect } from "next/navigation";

/** Other payments removed — use School expenses. */
export default function OtherPaymentsRedirect() {
  redirect("/finance/expenses");
}
