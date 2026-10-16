import { User } from "./user.entity";

export interface LoginResponse {
    success: boolean;
    data: {
        user: User;
        accessToken: string;
        refreshToken: string;
    };
    error?: string;
}

export interface RefreshResponse {
    success: boolean;
    data: {
        accessToken: string;
        refreshToken: string;
    };
}

export interface RegisterResponse {
    success: boolean;
    data: {
        message: string;
        user: User;
    };
}