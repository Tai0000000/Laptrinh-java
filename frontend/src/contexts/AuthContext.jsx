import React, { createContext, useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export const AuthContext = createContext();

const normalizeRole = (role) => {
  if (!role) {
    return null;
  }

  return role.startsWith("ROLE_") ? role.replace("ROLE_", "") : role;
};

export const getPrimaryRole = (user) => {
  if (!user) {
    return null;
  }

  if (user.role) {
    return normalizeRole(user.role);
  }

  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return normalizeRole(user.roles[0]);
  }

  return null;
};

export const getRouteByRole = (user) => {
  const role = getPrimaryRole(user);

  switch (role) {
    case "ADMIN":
      return "/admin";
    case "COLLECTOR":
      return "/collector";
    case "ENTERPRISE":
      return "/enterprise";
    case "CITIZEN":
      return user?.id ? `/citizen/${user.id}` : "/login";
    default:
      return "/login";
  }
};

const normalizeAuthUser = (data) => {
  const roles = Array.isArray(data?.roles) ? data.roles.map(normalizeRole) : [];
  const role = normalizeRole(data?.role) || roles[0] || null;

  return {
    id: data?.id ?? null,
    username: data?.username ?? "",
    email: data?.email ?? "",
    roles,
    role,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);
        setUser(normalizeAuthUser(parsedUser));
      }
    } catch (error) {
      console.error("Session error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const res = await axiosClient.post("/auth/signin", credentials);
      const data = res.data;
      const normalizedUser = normalizeAuthUser(data);

      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      localStorage.setItem("token", data.token);

      return {
        success: true,
        user: normalizedUser,
        redirectTo: getRouteByRole(normalizedUser),
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
