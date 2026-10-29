"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile, UserRole } from "@/types/api";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export interface DemoPersona {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  email: string;
  aliases?: string[];
  token: string;
  password?: string;
  department?: string;
  institution?: string;
  description?: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Alice Chen",
    role: "student",
    title: "Undergraduate Researcher",
    email: "alice.student@stanford.edu",
    aliases: ["alice.chen@stanford.edu"],
    token: "test-token-00000000-0000-0000-0000-000000000003",
    password: "password123",
    department: "Computer Science",
    institution: "Stanford University",
    description: "Third-year CS student with machine learning & PyTorch research focus.",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Prof. Alan Turing",
    role: "professor",
    title: "Full Professor & Chair of AI Lab",
    email: "prof.turing@stanford.edu",
    aliases: ["alan.turing@stanford.edu"],
    token: "test-token-00000000-0000-0000-0000-000000000002",
    password: "password123",
    department: "Computer Science",
    institution: "Stanford University",
    description: "Principal Investigator leading projects on neural reasoning and foundation models.",
  },
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Dr. Eleanor Vance",
    role: "admin",
    title: "Platform Administrator",
    email: "admin@researchbridge.edu",
    token: "test-token-00000000-0000-0000-0000-000000000001",
    password: "password123",
    department: "Administration",
    institution: "Stanford University",
    description: "Institutional administrator overseeing compliance, professor vetting, and audits.",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    name: "Bob Williams",
    role: "student",
    title: "Master's Candidate",
    email: "bob.student@stanford.edu",
    aliases: ["bob.smith@stanford.edu"],
    token: "test-token-00000000-0000-0000-0000-000000000004",
    password: "password123",
    department: "Computer Science",
    institution: "Stanford University",
    description: "Graduate student conducting distributed systems and data engineering research.",
  },
];

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  token: string | null;
  isLoading: boolean;
  activePersona: DemoPersona | null;
  switchPersona: (personaId: string) => Promise<void>;
  signInAsDemo: (personaId: string) => Promise<void>;
  signInWithEmail: (email: string, password: string, selectedRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  token: null,
  isLoading: true,
  activePersona: null,
  switchPersona: async () => {},
  signInAsDemo: async () => {},
  signInWithEmail: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePersona, setActivePersona] = useState<DemoPersona | null>(null);

  const initAuth = async () => {
    setIsLoading(true);
    try {
      const isLoggedOut = typeof window !== "undefined" && localStorage.getItem("rb_logged_out") === "true";
      const storedToken = api.getToken();

      // If user explicitly logged out and hasn't logged back in, remain logged out
      if (isLoggedOut && !storedToken) {
        setUser(null);
        setRole(null);
        setToken(null);
        setActivePersona(null);
        setIsLoading(false);
        return;
      }

      // 1. Check if demo persona is stored
      const matchedPersona = DEMO_PERSONAS.find((p) => p.token === storedToken);
      if (matchedPersona) {
        api.setToken(matchedPersona.token);
        setToken(matchedPersona.token);
        setActivePersona(matchedPersona);
        try {
          const profile = await api.getAuthMe();
          setUser(profile);
          setRole(profile.role);
        } catch {
          setUser({
            id: matchedPersona.id,
            email: matchedPersona.email,
            role: matchedPersona.role,
            full_name: matchedPersona.name,
            account_status: "active",
            is_active: true,
            institution_name: "Stanford University",
            department_name: matchedPersona.role === "admin" ? "Administration" : "Computer Science",
          });
          setRole(matchedPersona.role);
        }
        setIsLoading(false);
        return;
      }

      // 2. Fall back to Supabase Session
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          api.setToken(data.session.access_token);
          setToken(data.session.access_token);
          try {
            const profile = await api.getAuthMe();
            setUser(profile);
            setRole(profile.role);
          } catch {
            // keep session token
          }
          setIsLoading(false);
          return;
        }
      } catch {
        // ignore supabase error
      }

      // 3. Fall back to custom token
      if (storedToken) {
        try {
          const profile = await api.getAuthMe();
          setUser(profile);
          setRole(profile.role);
          setIsLoading(false);
          return;
        } catch {
          // invalid token
        }
      }

      // 4. Default to Alice Chen (Student) for a clean initial experience if not explicitly logged out
      if (!isLoggedOut) {
        const defaultPersona = DEMO_PERSONAS[0];
        api.setToken(defaultPersona.token);
        setToken(defaultPersona.token);
        setActivePersona(defaultPersona);
        try {
          const profile = await api.getAuthMe();
          setUser(profile);
          setRole(profile.role);
        } catch (e) {
          console.warn("Could not fetch profile for default persona:", e);
          setUser({
            id: defaultPersona.id,
            email: defaultPersona.email,
            role: defaultPersona.role,
            full_name: defaultPersona.name,
            account_status: "active",
            is_active: true,
            institution_name: "Stanford University",
            department_name: "Computer Science",
          });
          setRole(defaultPersona.role);
        }
      } else {
        setUser(null);
        setRole(null);
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const switchPersona = async (personaId: string) => {
    const persona = DEMO_PERSONAS.find((p) => p.id === personaId);
    if (!persona) return;
    setIsLoading(true);
    try {
      api.setToken(persona.token);
      setToken(persona.token);
      setActivePersona(persona);
      if (typeof window !== "undefined") {
        localStorage.removeItem("rb_logged_out");
      }
      try {
        const profile = await api.getAuthMe();
        setUser(profile);
        setRole(profile.role);
      } catch {
        setUser({
          id: persona.id,
          email: persona.email,
          role: persona.role,
          full_name: persona.name,
          account_status: "active",
          is_active: true,
          institution_name: "Stanford University",
          department_name: persona.role === "admin" ? "Administration" : "Computer Science",
        });
        setRole(persona.role);
      }
    } catch (err) {
      console.error("Error switching persona:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const signInAsDemo = async (personaId: string) => {
    await switchPersona(personaId);
  };

  const signInWithEmail = async (email: string, password: string, selectedRole?: UserRole) => {
    setIsLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();

      // 1. Instant check for any demo account (including canonical and aliases)
      const matchedDemo = DEMO_PERSONAS.find(
        (p) =>
          p.email.toLowerCase() === trimmedEmail ||
          p.aliases?.some((a) => a.toLowerCase() === trimmedEmail)
      );

      if (matchedDemo) {
        api.setToken(matchedDemo.token);
        setToken(matchedDemo.token);
        setActivePersona(matchedDemo);
        if (typeof window !== "undefined") {
          localStorage.removeItem("rb_logged_out");
        }
        try {
          const profile = await api.getAuthMe();
          setUser(profile);
          setRole(profile.role);
        } catch {
          setUser({
            id: matchedDemo.id,
            email: matchedDemo.email,
            role: matchedDemo.role,
            full_name: matchedDemo.name,
            account_status: "active",
            is_active: true,
            institution_name: "Stanford University",
            department_name: matchedDemo.role === "admin" ? "Administration" : "Computer Science",
          });
          setRole(matchedDemo.role);
        }
        return { success: true };
      }

      // 2. Attempt Supabase Auth
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!error && data.session?.access_token) {
          api.setToken(data.session.access_token);
          setToken(data.session.access_token);
          setActivePersona(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("rb_logged_out");
          }
          try {
            const profile = await api.getAuthMe();
            setUser(profile);
            setRole(profile.role);
          } catch {
            const defaultRole = selectedRole || (data.user?.user_metadata?.role as UserRole) || "student";
            setUser({
              id: data.user?.id || "custom-user",
              email: data.user?.email || email,
              role: defaultRole,
              full_name: data.user?.user_metadata?.full_name || email.split("@")[0],
              account_status: "active",
              is_active: true,
              institution_name: "Stanford University",
              department_name: defaultRole === "admin" ? "Administration" : "Computer Science",
            });
            setRole(defaultRole);
          }
          return { success: true };
        }
      } catch (sbErr) {
        console.warn("Supabase auth attempted:", sbErr);
      }

      // 3. Fallback: Local active session for custom credentials
      const targetRole = selectedRole || "student";
      const customId = `custom-${Date.now()}`;
      const mockToken = `test-token-${customId}`;
      api.setToken(mockToken);
      setToken(mockToken);
      setActivePersona(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("rb_logged_out");
      }
      setUser({
        id: customId,
        email: email,
        role: targetRole,
        full_name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        account_status: "active",
        is_active: true,
        institution_name: "Stanford University",
        department_name: targetRole === "admin" ? "Administration" : "Computer Science",
      });
      setRole(targetRole);
      return { success: true };
    } catch (err: any) {
      console.error("Sign in error:", err);
      return { success: false, error: err.message || "Invalid email or password." };
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    assignedRole: UserRole
  ) => {
    setIsLoading(true);
    try {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: assignedRole,
            },
          },
        });
        if (!error && data.session?.access_token) {
          api.setToken(data.session.access_token);
          setToken(data.session.access_token);
          setActivePersona(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("rb_logged_out");
          }
          try {
            const profile = await api.getAuthMe();
            setUser(profile);
            setRole(profile.role);
          } catch {
            setUser({
              id: data.user?.id || "custom-user",
              email: data.user?.email || email,
              role: assignedRole,
              full_name: fullName,
              account_status: "active",
              is_active: true,
              institution_name: "Stanford University",
              department_name: "Computer Science",
            });
            setRole(assignedRole);
          }
          return { success: true };
        }
      } catch (sbErr) {
        console.warn("Supabase signup attempted:", sbErr);
      }

      // Local custom signup fallback
      const customId = `custom-${Date.now()}`;
      const mockToken = `test-token-${customId}`;
      api.setToken(mockToken);
      setToken(mockToken);
      setActivePersona(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("rb_logged_out");
      }
      setUser({
        id: customId,
        email: email,
        role: assignedRole,
        full_name: fullName,
        account_status: "active",
        is_active: true,
        institution_name: "Stanford University",
        department_name: assignedRole === "admin" ? "Administration" : "Computer Science",
      });
      setRole(assignedRole);
      return { success: true };
    } catch (err: any) {
      console.error("Sign up error:", err);
      return { success: false, error: err.message || "Failed to register account." };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    api.setToken(null);
    setToken(null);
    setUser(null);
    setRole(null);
    setActivePersona(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("rb_logged_out", "true");
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await api.getAuthMe();
      setUser(profile);
      setRole(profile.role);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isLoading,
        activePersona,
        switchPersona,
        signInAsDemo,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
