export const RolePermissions: Record<string, string[]> = {
    ADMIN: ["user:create", "user:update", "user:get", "user:terminate"],
    USER: [] // will increase in future
}