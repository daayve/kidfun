import { createHash } from 'crypto';

// FAMILY_PIN: optional. If set, a device has to enter it once before the kid
// buttons show up. PARENT_PIN: protects /parent. Falls back to 0000 until set.
const familyPin = process.env.FAMILY_PIN || '';
const parentPin = process.env.PARENT_PIN || '0000';

export const parentPinIsDefault = !process.env.PARENT_PIN;

const token = (kind, pin) => createHash('sha256').update(`kidfun:${kind}:${pin}`).digest('hex');

export function checkPin(kind, pin) {
  const expected = kind === 'parent' ? parentPin : familyPin;
  return String(pin) === expected;
}

export function cookieFor(kind) {
  return {
    name: `kidfun_${kind}`,
    value: token(kind, kind === 'parent' ? parentPin : familyPin),
    options: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 180 },
  };
}

export function isParent(req) {
  return req.cookies.get('kidfun_parent')?.value === token('parent', parentPin);
}

export function isFamily(req) {
  if (!familyPin) return true;
  return isParent(req) || req.cookies.get('kidfun_family')?.value === token('family', familyPin);
}
