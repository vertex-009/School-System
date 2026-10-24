import { formatCnic } from "@/lib/cnic";

export type StudentProfile = {
  name: string;
  father_name?: string | null;
  admission_no: string;
  roll_no?: number | null;
  gender?: string | null;
  dob?: string | null;
  cnic?: string | null;
  guardian_phone?: string | null;
  address?: string | null;
  status?: string | null;
  photo_url?: string | null;
  className?: string | null;
  joined_on?: string | null;
};

function dash(v: string | number | null | undefined) {
  if (v === null || v === undefined || String(v).trim() === "") return "NA";
  return String(v);
}

export function formatAdmissionNo(val?: string | null): string {
  if (!val || String(val).trim() === "") return "NA";
  const str = String(val).trim();
  if (/^[A-Za-z]+-\d+$/i.test(str)) {
    return str.toUpperCase();
  }
  if (/^\d+$/.test(str)) {
    return `ADM-${str}`;
  }
  return str;
}

function formatDob(dob?: string | null) {
  if (!dob) return "NA";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return dob;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span style={{ fontWeight: 700, color: "#1e293b" }}>{label} :</span>{" "}
      <span style={{ color: "#334155" }}>{value}</span>
    </>
  );
}

/** CU Online–style student profile: photo left, zebra detail grid right. */
export function StudentProfileCard({ student }: { student: StudentProfile }) {
  const rowBg = ["#eceff1", "#ffffff"] as const;
  const border = "1px solid #cfd8dc";
  const cellPad = "10px 14px";
  const font = "13px/1.45 system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

  const rows: { left: { label: string; value: string }; right: { label: string; value: string } }[] = [
    {
      left: { label: "Name", value: dash(student.name) },
      right: { label: "Admission No", value: formatAdmissionNo(student.admission_no) },
    },
    {
      left: { label: "Father Name", value: dash(student.father_name) },
      right: { label: "Roll No", value: dash(student.roll_no) },
    },
    {
      left: { label: "Class", value: dash(student.className) },
      right: {
        label: "Status",
        value: dash(student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : null),
      },
    },
    {
      left: { label: "Gender", value: dash(student.gender) },
      right: { label: "Guardian Phone", value: dash(student.guardian_phone) },
    },
    {
      left: { label: "Date of Birth", value: formatDob(student.dob) },
      right: { label: "CNIC", value: student.cnic ? formatCnic(student.cnic) : "NA" },
    },
    {
      left: { label: "Admission Date", value: formatDob(student.joined_on) },
      right: { label: "Address", value: dash(student.address) },
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        overflow: "auto",
        background: "#f5f5f5",
        border: "1px solid #b0bec5",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          font,
        }}
      >
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: rowBg[i % 2] }}>
              {i === 0 && (
                <td
                  rowSpan={rows.length}
                  style={{
                    width: 130,
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
                      width: 110,
                      height: 130,
                      margin: "0 auto",
                      border: "2px solid #eceff1",
                      background: "#e2e8f0",
                      overflow: "hidden",
                    }}
                  >
                    {student.photo_url ? (
                      <img
                        src={student.photo_url}
                        alt={student.name}
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
                        {initials(student.name) || "?"}
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
