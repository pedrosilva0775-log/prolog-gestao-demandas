import crypto from 'node:crypto';

const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const encryptionKey=()=>{
  const raw=process.env.MFA_ENCRYPTION_KEY||'';
  const key=Buffer.from(raw,'base64');
  if(key.length!==32)throw new Error('MFA_ENCRYPTION_KEY deve ser uma chave base64 de 32 bytes.');
  return key;
};

export const generateMfaSecret=()=>crypto.randomBytes(20);

export const encodeBase32=(value:Uint8Array)=>{
  let bits='';for(const byte of value)bits+=byte.toString(2).padStart(8,'0');
  let output='';for(let index=0;index<bits.length;index+=5)output+=alphabet[Number.parseInt(bits.slice(index,index+5).padEnd(5,'0'),2)];
  return output;
};

const decodeBase32=(value:string)=>{
  let bits='';for(const character of value.toUpperCase().replace(/=+$/,'')){const index=alphabet.indexOf(character);if(index<0)throw new Error('Segredo base32 inválido.');bits+=index.toString(2).padStart(5,'0');}
  const bytes:number[]=[];for(let index=0;index+8<=bits.length;index+=8)bytes.push(Number.parseInt(bits.slice(index,index+8),2));return Buffer.from(bytes);
};

export const totp=(secret:Uint8Array,at=Date.now())=>{
  const counter=Math.floor(at/30000);const buffer=Buffer.alloc(8);buffer.writeBigUInt64BE(BigInt(counter));
  const digest=crypto.createHmac('sha1',secret).update(buffer).digest();const offset=digest[digest.length-1]&15;
  return (((digest[offset]&127)<<24)|(digest[offset+1]<<16)|(digest[offset+2]<<8)|digest[offset+3])%1_000_000;
};

export const verifyTotp=(secret:Uint8Array,code:string,at=Date.now())=>{
  if(!/^\d{6}$/.test(code))return false;
  return [-30000,0,30000].some(offset=>crypto.timingSafeEqual(Buffer.from(String(totp(secret,at+offset)).padStart(6,'0')),Buffer.from(code)));
};

export const encryptMfaSecret=(secret:Uint8Array)=>{const iv=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',encryptionKey(),iv);const encrypted=Buffer.concat([cipher.update(secret),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),encrypted]);};
export const decryptMfaSecret=(payload:Uint8Array)=>{const value=Buffer.from(payload);if(value.length<29)throw new Error('Segredo MFA criptografado inválido.');const decipher=crypto.createDecipheriv('aes-256-gcm',encryptionKey(),value.subarray(0,12));decipher.setAuthTag(value.subarray(12,28));return Buffer.concat([decipher.update(value.subarray(28)),decipher.final()]);};

export const mfaUri=(secret:Uint8Array,email:string)=>`otpauth://totp/${encodeURIComponent(`PROLOG:${email}`)}?secret=${encodeBase32(secret)}&issuer=PROLOG&algorithm=SHA1&digits=6&period=30`;
export const generateRecoveryCodes=()=>Array.from({length:10},()=>crypto.randomBytes(6).toString('hex').toUpperCase().match(/.{1,4}/g)!.join('-'));
export const hashRecoveryCode=(code:string)=>crypto.createHmac('sha256',encryptionKey()).update(code.replace(/[^a-f0-9]/gi,'').toUpperCase()).digest('hex');
export const decodeMfaSecretForTest=decodeBase32;
