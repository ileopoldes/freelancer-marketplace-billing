import { apiClient } from "./client";

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post("/api/auth/login", credentials);
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get("/api/auth/me");
  },
};
