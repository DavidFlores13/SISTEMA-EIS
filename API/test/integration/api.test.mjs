import request from "supertest";
import { describe, beforeAll, it, expect, afterAll } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createDb } = require("../../src/lib/db");
const { createApp } = require("../../src/app");

const env = {
  corsOrigin: "*",
  jwtSecret: "test-secret",
  jwtExpiresIn: "1h",
  adminUser: "admin",
  adminPassword: "admin123",
  adminPasswordHash: "",
};

const db = createDb("DB EIS.db");
const app = createApp({ db, env });

let token = "";

describe("API v1 auth + protected routes", () => {
  beforeAll(async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "admin", password: "admin123" });

    token = loginRes.body.token;
  });

  afterAll(async () => {
    await db.close();
  });

  it("debe loguear y devolver token", async () => {
    expect(token).toBeTruthy();
  });

  it("debe bloquear acceso sin token", async () => {
    const res = await request(app).get("/api/v1/dashboard/resumen");
    expect(res.statusCode).toBe(401);
  });

  it("debe permitir acceso con token", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/resumen")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("total_ventas");
  });
});
