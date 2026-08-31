export type AdminPermission = "product.write" | "product.delete" | "order.write" | "member.write";
export type AdminRole = "owner" | "manager" | "editor" | "viewer";

export const adminPermissions: Record<AdminRole, readonly AdminPermission[]> = {
  owner: ["product.write", "product.delete", "order.write", "member.write"],
  manager: ["product.write", "order.write", "member.write"],
  editor: ["product.write"],
  viewer: [],
};

export function canAdmin(role: string | undefined, permission: AdminPermission) {
  if (!role || !(role in adminPermissions)) return false;
  return adminPermissions[role as AdminRole].includes(permission);
}
