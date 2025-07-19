import { vi, expect, test, describe, beforeEach } from "vitest";
import { usersApi } from "../users";
import { apiClient } from "../client";

// Mock the API client
vi.mock("../client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

describe("usersApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("create should call POST /api/users", async () => {
    const userData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      username: "johndoe",
      password: "password123",
      role: "USER" as any,
    };

    const expectedResult = { id: "1", ...userData };
    mockApiClient.post.mockResolvedValue(expectedResult);

    const result = await usersApi.create(userData);

    expect(mockApiClient.post).toHaveBeenCalledWith("/api/users", userData);
    expect(result).toEqual(expectedResult);
  });

  test("getAll should call GET /api/users with pagination", async () => {
    const expectedResult = { data: [], total: 0 };
    mockApiClient.get.mockResolvedValue(expectedResult);

    const result = await usersApi.getAll(1, 10);

    expect(mockApiClient.get).toHaveBeenCalledWith(
      "/api/users?page=1&limit=10",
    );
    expect(result).toEqual(expectedResult);
  });

  test("checkUsername should call GET /api/users/check-username", async () => {
    const expectedResult = { exists: false };
    mockApiClient.get.mockResolvedValue(expectedResult);

    const result = await usersApi.checkUsername("testuser");

    expect(mockApiClient.get).toHaveBeenCalledWith(
      "/api/users/check-username?username=testuser",
    );
    expect(result).toEqual(expectedResult);
  });
});
