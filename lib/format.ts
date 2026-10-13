export function pkr(value: number | string | null | undefined) {
  return `Rs ${(Number(value) || 0).toLocaleString("en-PK")}`;
}
export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
