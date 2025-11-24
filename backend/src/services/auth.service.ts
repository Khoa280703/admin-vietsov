import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../entities/User";

export interface TokenPayload {
  userId: number;
  roleId: number;
  username: string;
}

export class AuthService {
  private static getJwtSecret(): string {
    return process.env.JWT_SECRET || "your-secret-key";
  }

  private static getJwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || "24h";
  }

  private static getJwtRefreshExpiresIn(): string {
    return process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  }

  static generateToken(user: User): { accessToken: string; refreshToken: string } {
    const payload: TokenPayload = {
      userId: user.id,
      roleId: user.roleId,
      username: user.username,
    };

    const secret = this.getJwtSecret();
    const accessToken = jwt.sign(payload, secret, {
      expiresIn: this.getJwtExpiresIn(),
    } as SignOptions);
    const refreshToken = jwt.sign(payload, secret, {
      expiresIn: this.getJwtRefreshExpiresIn(),
    } as SignOptions);

    return { accessToken, refreshToken };
  }

  static verifyToken(token: string): TokenPayload {
    try {
      const secret = this.getJwtSecret();
      return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  static refreshToken(refreshToken: string): { accessToken: string } {
    const payload = this.verifyToken(refreshToken);
    const newPayload: TokenPayload = {
      userId: payload.userId,
      roleId: payload.roleId,
      username: payload.username,
    };

    const secret = this.getJwtSecret();
    const accessToken = jwt.sign(newPayload, secret, {
      expiresIn: this.getJwtExpiresIn(),
    } as SignOptions);

    return { accessToken };
  }
}

