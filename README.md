# School SMS (Lite)
Next.js + TypeScript + Tailwind + Supabase.

## Roles
| Role | Job |
|---|---|
| Super Admin | Create schools |
| Principal | Oversee school (academic); fees/students are view/overview |
| Finance | Students, class fees, invoices, receipts, teacher salaries |
| Accountant | Collect cash + student fee history rows |
| Teacher | Attendance / marks |

## Super Admin
| | |
|---|---|
| **Email** | `admin@schoolsms.com` |
| **Password** | `SuperAdmin123` |

## Setup
1. `supabase/schema.sql`
2. `supabase/migration_roles_finance.sql` (roles + salaries)
3. `supabase/seed_super_admin.sql`
4. For an existing school: `supabase/seed_finance_accountant.sql`  
   → Finance `finance@schoolsms.com` / `Finance123`  
   → Accountant `accountant@schoolsms.com` / `Account123`
5. `npm run dev` → http://localhost:3000

Never put the secret key in browser code.
