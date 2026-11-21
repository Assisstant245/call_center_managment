import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "./../src/app.module";

/**
 * Requires a running PostgreSQL (DATABASE_URL). Run with: npm run test:e2e
 */
describe("API (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health is public", () => {
    return request(app.getHttpServer()).get("/health").expect(200);
  });

  it("protected routes need a token", () => {
    return request(app.getHttpServer()).get("/agents").expect(401);
  });

  it("login rejects wrong credentials", () => {
    return request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "wrong-password" })
      .expect(401);
  });

  it("login validates the payload", () => {
    return request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "not-an-email" })
      .expect(400);
  });
});
