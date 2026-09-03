import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { apiErrorResponseSchema } from '../contracts/common';
import { apiErrorCodeForStatus, sendApiError } from './apiErrors';

describe('erros da API v1', () => {
  it('mapeia indisponibilidade e erro interno sem expor detalhes', () => {
    expect(apiErrorCodeForStatus(503)).toBe('SERVICE_UNAVAILABLE');
    expect(apiErrorCodeForStatus(500)).toBe('INTERNAL_ERROR');
    expect(apiErrorCodeForStatus(415)).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('sempre produz envelope válido com requestId', async () => {
    const app=express();
    app.get('/indisponivel',(_req,res)=>sendApiError(res,503,'SERVICE_UNAVAILABLE','Serviço temporariamente indisponível.'));
    const result=await request(app).get('/indisponivel').expect(503);
    expect(apiErrorResponseSchema.parse(result.body)).toEqual(result.body);
    expect(result.body).toMatchObject({ code: 'SERVICE_UNAVAILABLE', message: 'Serviço temporariamente indisponível.' });
    expect(result.body.requestId).toBeTruthy();
  });
});
