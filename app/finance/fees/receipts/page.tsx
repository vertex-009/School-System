import { redirect } from "next/navigation";

/** Receipt list removed from nav — print from Collection history. Keep /receipts/[id] for print. */
export default function FeeReceiptsListRedirect() {
  redirect("/finance/history");
}
