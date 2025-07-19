export interface AuthenticatedUser {
    userId: string;
    tenantId: string;
    role: string;
}

export interface AuthTokenPayload extends AuthenticatedUser{
    iat: number;
    exp: number;
}