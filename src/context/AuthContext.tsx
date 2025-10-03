"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { login as apiLogin, logout as apiLogout, me } from "@/features/services/auth.service";
import type { User } from "@/features/auth/models";

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Sync entre pestañas
  const bcRef = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    bcRef.current = new BroadcastChannel("auth");
    bcRef.current.onmessage = (ev) => {
      if (ev.data === "logout") {
        setUser(null);
        router.replace("/login?multi=1");
      }
    };
    return () => bcRef.current?.close();
  }, [router]);

  // 🚀 Bootstrap de sesión
  useEffect(() => {
    (async () => {
      try {
        const u = await me();
        setUser(u);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  //Si expira en cualquier request -> ir al login
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      bcRef.current?.postMessage("logout");
      const from = encodeURIComponent(pathname || "/");
      router.replace(`/login?expired=1&from=${from}`);
      router.refresh();
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [pathname, router]);

  // (Opcional) Auto-logout por inactividad (ej. 30 min)
  useEffect(() => {
    const IDLE_MS = 30 * 60 * 1000;
    let t: number | undefined;

    const reset = () => {
      if (t) window.clearTimeout(t);
      if (user) {
        t = window.setTimeout(() => {
          // disparamos como si expirara
          window.dispatchEvent(new Event("auth:expired"));
        }, IDLE_MS);
      }
    };

    ["click", "keydown", "mousemove", "scroll", "touchstart"].forEach((ev) =>
      window.addEventListener(ev, reset, { passive: true })
    );

    reset();
    return () => {
      if (t) window.clearTimeout(t);
      ["click", "keydown", "mousemove", "scroll", "touchstart"].forEach((ev) =>
        window.removeEventListener(ev, reset)
      );
    };
  }, [user]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      await apiLogin({ username, password });
      const u = await me();
      setUser(u);
      router.replace("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout(); // si esto tira 401, igual seguimos
    } catch {}
    setUser(null);
    bcRef.current?.postMessage("logout");
    router.replace("/login");
    router.refresh();
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
