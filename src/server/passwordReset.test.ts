import { afterEach,describe,expect,it,vi } from 'vitest';
import { deliverPasswordReset,passwordResetConfigured } from './passwordReset.js';

const original={url:process.env.PASSWORD_RESET_WEBHOOK_URL,secret:process.env.PASSWORD_RESET_WEBHOOK_SECRET,app:process.env.APP_URL};
afterEach(()=>{process.env.PASSWORD_RESET_WEBHOOK_URL=original.url;process.env.PASSWORD_RESET_WEBHOOK_SECRET=original.secret;process.env.APP_URL=original.app;vi.unstubAllGlobals();});
describe('entrega de recuperação de senha',()=>{it('exige configuração completa',()=>{delete process.env.PASSWORD_RESET_WEBHOOK_URL;expect(passwordResetConfigured()).toBe(false);});it('envia token somente no corpo do webhook autenticado',async()=>{process.env.PASSWORD_RESET_WEBHOOK_URL='https://mailer.test/reset';process.env.PASSWORD_RESET_WEBHOOK_SECRET='secret';process.env.APP_URL='https://prolog.test';const fetchMock=vi.fn().mockResolvedValue(new Response(null,{status:202}));vi.stubGlobal('fetch',fetchMock);await deliverPasswordReset('user@test.local','token-seguro');const [,init]=fetchMock.mock.calls[0];expect(init.headers.Authorization).toBe('Bearer secret');expect(init.body).toContain('token-seguro');});});
