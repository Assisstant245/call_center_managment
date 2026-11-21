import { ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { ROLES_KEY } from "./roles.decorator";

const jwt = new JwtService({ secret: "test-secret" });

function context(request: object, metadata: Record<string, unknown> = {}) {
  return {
    getType: () => "http",
    getHandler: () => ({ metadata }),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function reflectorFor(): Reflector {
  const reflector = new Reflector();
  jest
    .spyOn(reflector, "getAllAndOverride")
    .mockImplementation((key, targets) => {
      const handler = (targets as { metadata?: Record<string, unknown> }[])[0];
      return handler.metadata?.[key as string];
    });
  return reflector;
}

describe("JwtAuthGuard", () => {
  const guard = new JwtAuthGuard(jwt, reflectorFor());

  it("lets @Public routes through without a token", async () => {
    await expect(
      guard.canActivate(context({ headers: {} }, { [IS_PUBLIC_KEY]: true })),
    ).resolves.toBe(true);
  });

  it("rejects requests without a bearer token", async () => {
    await expect(guard.canActivate(context({ headers: {} }))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rejects an invalid token", async () => {
    await expect(
      guard.canActivate(context({ headers: { authorization: "Bearer nope" } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("accepts a valid token and attaches the user", async () => {
    const token = await jwt.signAsync({ sub: 7, email: "a@b.c", role: "manager" });
    const req: { headers: Record<string, string>; user?: { sub: number } } = {
      headers: { authorization: `Bearer ${token}` },
    };
    await expect(guard.canActivate(context(req))).resolves.toBe(true);
    expect(req.user?.sub).toBe(7);
  });

  it("rejects a token signed with another secret", async () => {
    const forged = await new JwtService({ secret: "other" }).signAsync({ sub: 1, role: "admin" });
    await expect(
      guard.canActivate(context({ headers: { authorization: `Bearer ${forged}` } })),
    ).rejects.toThrow(UnauthorizedException);
  });
});

describe("RolesGuard", () => {
  const guard = new RolesGuard(reflectorFor());

  it("allows routes with no role restriction", () => {
    expect(guard.canActivate(context({ user: { role: "agent" } }))).toBe(true);
  });

  it("allows a user whose role is listed", () => {
    expect(
      guard.canActivate(
        context({ user: { role: "planner" } }, { [ROLES_KEY]: ["admin", "planner"] }),
      ),
    ).toBe(true);
  });

  it("forbids a user whose role is not listed", () => {
    expect(() =>
      guard.canActivate(context({ user: { role: "agent" } }, { [ROLES_KEY]: ["admin"] })),
    ).toThrow(ForbiddenException);
  });
});
