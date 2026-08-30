import { describe, expect, it } from 'vitest';
import { redact } from './logger.js';

describe('logger estruturado',()=>{
  it('remove credenciais e PII em objetos aninhados',()=>{
    expect(redact({email:'pessoa@empresa.test',nested:{password:'segredo',name:'Nome'}})).toEqual({email:'[REDACTED]',nested:{password:'[REDACTED]',name:'Nome'}});
  });
});
