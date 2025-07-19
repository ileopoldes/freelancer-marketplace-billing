export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
};

export const getUserInfo = (): User | null => {
  if (typeof window === "undefined") return null;

  const id = localStorage.getItem("userId");
  const email = localStorage.getItem("userEmail");
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("userRole");

  if (id && email && username && role) {
    return { id, email, username, role };
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
  localStorage.removeItem("userId");
  localStorage.removeItem("username");

  // Redirect to login page
  window.location.href = "/login";
};

export const isAdmin = (): boolean => {
  const user = getUserInfo();
  return user?.role === "admin";
};
