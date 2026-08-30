import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createHealthRouter } from './health.js';

describe('saúde do processo',()=>{
  it('responde sem expor infraestrutura',async()=>{
    const app=express().use(createHealthRouter());
    const response=await request(app).get('/health').expect(200).expect('Cache-Control','no-store');
    expect(response.body.status).toBe('ok');
    expect(response.body).not.toHaveProperty('databaseUrl');
  });
});
