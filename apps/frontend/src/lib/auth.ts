export interface User {
  email: string;
  role: string;
}

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
};

export const getUserInfo = (): User | null => {
  if (typeof window === "undefined") return null;

  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole");

  if (email && role) {
    return { email, role };
  }

  return null;
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const logout = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("authToken");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");

  // Redirect to login page
  window.location.href = "/login";
};

export const isAdmin = (): boolean => {
  const user = getUserInfo();
  return user?.role === "admin";
};
