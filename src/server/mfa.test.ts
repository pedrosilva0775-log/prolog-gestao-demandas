import crypto from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { decodeMfaSecretForTest, decryptMfaSecret, encodeBase32, encryptMfaSecret, generateMfaSecret, generateRecoveryCodes, hashRecoveryCode, totp, verifyTotp } from './mfa.js';

describe('MFA TOTP',()=>{
  beforeAll(()=>{process.env.MFA_ENCRYPTION_KEY=crypto.randomBytes(32).toString('base64');});
  it('codifica base32 sem perder o segredo',()=>{const secret=generateMfaSecret();expect(decodeMfaSecretForTest(encodeBase32(secret))).toEqual(Buffer.from(secret));});
  it('valida TOTP atual e rejeita código incorreto',()=>{const secret=generateMfaSecret();const now=1_800_000_000_000;const code=String(totp(secret,now)).padStart(6,'0');expect(verifyTotp(secret,code,now)).toBe(true);expect(verifyTotp(secret,'000000',now)).toBe(code==='000000');});
  it('criptografa o segredo com integridade autenticada',()=>{const secret=generateMfaSecret();const encrypted=encryptMfaSecret(secret);expect(encrypted).not.toContain(Buffer.from(secret));expect(decryptMfaSecret(encrypted)).toEqual(Buffer.from(secret));encrypted[encrypted.length-1]^=1;expect(()=>decryptMfaSecret(encrypted)).toThrow();});
  it('gera dez códigos de recuperação únicos e hashes não reversíveis',()=>{const codes=generateRecoveryCodes();expect(new Set(codes).size).toBe(10);expect(hashRecoveryCode(codes[0])).toMatch(/^[a-f0-9]{64}$/);expect(hashRecoveryCode(codes[0])).not.toContain(codes[0]);});
});
