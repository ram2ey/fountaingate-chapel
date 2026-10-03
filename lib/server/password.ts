import 'server-only';
import { hash, verify } from '@node-rs/argon2';

export function validatePassword(password: unknown): asserts password is string {
  if (typeof password !== 'string' || password.length < 15 || password.length > 128) {
    throw new Error('Use a password between 15 and 128 characters.');
  }
}
export function hashPassword(password: string) {
  return hash(password, { algorithm: 2 /* Argon2id */, memoryCost: 65536, timeCost: 3, parallelism: 1 });
}
export async function verifyPassword(hashValue: string, password: string) {
  try { return await verify(hashValue, password); } catch { return false; }
}
