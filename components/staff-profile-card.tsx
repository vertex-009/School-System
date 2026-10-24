import { formatCnic } from "@/lib/cnic";
import { pkr } from "@/lib/format";

export type StaffProfile = {
  name: string;
  role: string;
  phone?: string | null;
  cnic?: string | null;
  email?: string | null;
  joined_on?: string | null;
  is_active?: boolean | null;
  photo_url?: string | null;
  monthly_salary?: number | null;
  salary_status?: "Paid" | "Unpaid" | "—" | null;
  salary_paid_amount?: number | null;
  period_label?: string | null;
};

function dash(v: string | number | null | undefined) {
  if (v === null || v === undefined || String(v).trim() === "") return "NA";
  return String(v);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function formatDate(dStr?: string | null) {
  if (!dStr) return "NA";
  const d = new Date(dStr);
  if (Number.isNaN(d.getTime())) return dStr;
  return d.toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" });
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span style={{ fontWeight: 700, color: "#1e293b" }}>{label} :</span>{" "}
      <span style={{ color: "#334155" }}>{value}</span>
    </>
  );
}

/** Original CU Online–style staff profile card: photo left, zebra detail grid right. */
export function StaffProfileCard({ staff }: { staff: StaffProfile }) {
  const rowBg = ["#eceff1", "#ffffff"] as const;
  const border = "1px solid #cfd8dc";
  const cellPad = "10px 14px";
  const font = "13px/1.45 system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  const roleLabel =
    staff.role === "finance"
      ? "Finance"
      : staff.role === "teacher"
        ? "Teacher"
        : staff.role;

  const rows: { left: { label: string; value: string }; right: { label: string; value: string } }[] = [
    {
      left: { label: "Name", value: dash(staff.name) },
      right: { label: "Role", value: dash(roleLabel) },
    },
    {
      left: { label: "Email / Gmail", value: dash(staff.email) },
      right: { label: "Phone", value: dash(staff.phone) },
    },
    {
      left: { label: "CNIC", value: staff.cnic ? formatCnic(staff.cnic) : "NA" },
      right: { label: "Status", value: staff.is_active === false ? "Suspended" : "Active" },
    },
    {
      left: { label: "Joined Date", value: formatDate(staff.joined_on) },
      right: {
        label: "Monthly salary",
        value: staff.monthly_salary != null && staff.monthly_salary > 0 ? pkr(staff.monthly_salary) : "Not set",
      },
    },
  ];

  return (
    <div style={{ width: "100%", overflow: "auto", background: "#f5f5f5", border: "1px solid #b0bec5" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", font }}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: rowBg[i % 2] }}>
              {i === 0 && (
                <td
                  rowSpan={rows.length}
                  style={{
                    width: 140,
                    verticalAlign: "middle",
                    textAlign: "center",
                    background: "#fff",
                    borderRight: border,
                    borderBottom: border,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      width: 115,
                      height: 135,
                      margin: "0 auto",
                      border: "2px solid #eceff1",
                      background: "#e2e8f0",
                      overflow: "hidden",
                    }}
                  >
                    {staff.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={staff.photo_url}
                        alt={staff.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 28,
                          fontWeight: 700,
                          color: "#64748b",
                          background: "linear-gradient(#f1f5f9, #e2e8f0)",
                        }}
                      >
                        {initials(staff.name) || "?"}
                      </div>
                    )}
                  </div>
                </td>
              )}
              <td style={{ width: "42%", borderBottom: border, borderRight: border, padding: cellPad, verticalAlign: "middle" }}>
                <Pair label={row.left.label} value={row.left.value} />
              </td>
              <td style={{ width: "42%", borderBottom: border, padding: cellPad, verticalAlign: "middle" }}>
                <Pair label={row.right.label} value={row.right.value} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
