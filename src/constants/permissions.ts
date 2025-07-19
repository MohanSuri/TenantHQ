export const RolePermissions: Record<string, string[]> = {
    ADMIN: ["user:create", "user:update", "user:get", "user:delete"],
    USER: [] // will increase in future
}