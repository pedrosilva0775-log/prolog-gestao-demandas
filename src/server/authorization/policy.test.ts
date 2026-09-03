import { describe, expect, it } from "vitest";
import { effectivePermissions, isAuthorized, knownPermissions } from "./policy";

const base = {
  scope: "module" as const,
  globalRole: "colaborador",
  moduleRole: "member" as const,
  moduleActive: true,
  membershipActive: true,
  grants: [] as string[],
  revocations: [] as string[],
};

describe("política central de autorização", () => {
  it("nega permissão desconhecida e falha de vínculo", () => {
    expect(isAuthorized({ ...base, permission: "unknown:admin" })).toBe(false);
    expect(
      isAuthorized({
        ...base,
        permission: "demands:read",
        membershipActive: false,
      }),
    ).toBe(false);
    expect(
      isAuthorized({
        ...base,
        permission: "demands:read",
        moduleActive: false,
      }),
    ).toBe(false);
  });

  it("limita viewer e permite operações de member", () => {
    expect(
      isAuthorized({
        ...base,
        moduleRole: "viewer",
        permission: "demands:create",
      }),
    ).toBe(false);
    expect(isAuthorized({ ...base, permission: "demands:update" })).toBe(true);
  });

  it("faz revogação prevalecer sobre papel, concessão e administrador global", () => {
    expect(
      isAuthorized({
        ...base,
        permission: "demands:update",
        grants: ["demands:edit"],
        revocations: ["demands:edit"],
      }),
    ).toBe(false);
    expect(
      isAuthorized({
        ...base,
        globalRole: "admin",
        permission: "audit:read",
        revocations: ["audit:read"],
      }),
    ).toBe(false);
  });

  it("não deixa concessão atravessar módulo sem vínculo", () => {
    expect(
      isAuthorized({
        ...base,
        permission: "audit:read",
        grants: ["audit:read"],
        membershipActive: false,
      }),
    ).toBe(false);
  });

  it("calcula a mesma lista efetiva usada pela API", () => {
    const permissions = effectivePermissions({ ...base, moduleRole: "viewer" });
    expect(permissions).toContain("demands:read");
    expect(permissions).not.toContain("demands:update");
  });

  it("aplica revogações agregadas de usuários e equipes aos aliases específicos", () => {
    for (const revocation of ["users", "users_teams"]) {
      expect(isAuthorized({ ...base, scope: "global", globalRole: "admin", permission: "users:create", revocations: [revocation] })).toBe(false);
    }
  });

  it("mantém no catálogo todas as permissões exigidas pelos endpoints", () => {
    const endpointPermissions = ["audit:read", "clients:create", "clients:read", "clients:update", "comments:create", "comments:edit", "comments:admin", "configurations:update", "demands:create", "demands:delete", "demands:read", "demands:update", "privacy:manage", "teams:create", "teams:read", "teams:update", "users:create", "users:update", "modules:read", "modules:create", "modules:update", "modules:members"];
    expect(endpointPermissions.filter(permission => !knownPermissions.has(permission))).toEqual([]);
  });
});
