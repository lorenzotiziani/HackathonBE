export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}
export interface RefreshToken {
  id: number;
  token: string;
  userId: number;
  expiresAt: Date;
  isRevoked: boolean | null;
  createdAt: Date;
}
