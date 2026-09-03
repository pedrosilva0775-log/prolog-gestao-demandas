import { describe, expect, it } from 'vitest';
import { redact, redactRequestPath } from './logger';

describe('logger estruturado',()=>{
  it('remove credenciais e PII em objetos aninhados',()=>{
    expect(redact({email:'pessoa@empresa.test',nested:{password:'segredo',name:'Nome'}})).toEqual({email:'[REDACTED]',nested:{password:'[REDACTED]',name:'Nome'}});
  });
});

describe('redação de caminhos públicos', () => {
  it('remove tokens de links externos sem ocultar o nome da rota', () => {
    expect(redactRequestPath('/api/public/request-links/token-super-secreto')).toBe(
      '/api/public/request-links/[REDACTED]',
    );
    expect(redactRequestPath('/request-links/token-super-secreto')).toBe(
      '/request-links/[REDACTED]',
    );
  });

  it('não altera caminhos que não carregam credenciais', () => {
    expect(redactRequestPath('/api/v1/modules')).toBe('/api/v1/modules');
  });
});
