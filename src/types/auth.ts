export interface AuthTokenPayload{
    userId: string;
    tenantId: string;
    role: string;
    iat: number;
    exp: number;
}