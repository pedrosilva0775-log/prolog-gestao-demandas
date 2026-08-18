import crypto from 'node:crypto';

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
};
export const verifyPasswordHash = (password: string, stored: string | null) => {
  if (!stored) return false;
  const [salt, expectedHex] = stored.split(':');
  if (!salt || !expectedHex) return false;
  const supplied = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
};
export const validPassword = (password: string) => password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
