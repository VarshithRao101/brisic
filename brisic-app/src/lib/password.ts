/** Returns why a password is too weak, or null when it is acceptable. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8 || pw.length > 100 || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
    return "Password needs 8+ characters with upper and lower case, a number and a symbol.";
  }
  return null;
}
