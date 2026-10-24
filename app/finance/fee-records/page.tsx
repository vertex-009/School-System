import { redirect } from "next/navigation";

/** Student fee records merged into Collection history. */
export default function FeeRecordsRedirect() {
  redirect("/finance/history");
}
