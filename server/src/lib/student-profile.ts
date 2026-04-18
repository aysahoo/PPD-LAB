/**
 * Whether a student has the minimum profile fields required to request enrollment:
 * name, phone, valid 12-digit Aadhaar, and a positive integer rank.
 */
export function isStudentProfileComplete(
  name: string | null,
  phone: string | null,
  aadhaarNumber: string | null,
  studentRank: number | null,
): boolean {
  const n = name?.trim() ?? "";
  const p = phone?.trim() ?? "";
  const a = aadhaarNumber?.trim() ?? "";
  if (n.length === 0 || p.length === 0) return false;
  if (!/^\d{12}$/.test(a)) return false;
  if (studentRank == null || !Number.isInteger(studentRank) || studentRank <= 0) return false;
  return true;
}
