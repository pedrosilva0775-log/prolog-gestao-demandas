import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApiRouter } from "../api.js";

describe("falha fechada da autorização", () => {
  it("retorna indisponibilidade e nunca libera a rota quando a consulta falha", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/v1", createApiRouter(() => ({ id: "user-test", role: "admin" }), async () => { throw new Error("database unavailable"); }));
    const response = await request(app).get("/api/v1/clients").expect(503);
    expect(response.body).toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(response.body.requestId).toBeTruthy();
  });
});
