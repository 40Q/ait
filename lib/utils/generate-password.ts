/**
 * Generates a cryptographically random password that satisfies the application's
 * password requirements: 8+ characters, uppercase, lowercase, digit, special char.
 */
export function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*";
  const all = upper + lower + digits + special;

  const getChar = (charset: string) => {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return charset[arr[0] % charset.length];
  };

  const chars = [
    getChar(upper),
    getChar(lower),
    getChar(digits),
    getChar(special),
    ...Array.from({ length: 8 }, () => getChar(all)),
  ];

  for (let i = chars.length - 1; i > 0; i--) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const j = arr[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
