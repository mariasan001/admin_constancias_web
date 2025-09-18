"use client";

import { useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { User2, Lock, Eye, EyeOff } from "lucide-react";
import styles from "@/components/login.module.css";

export default function LoginForm() {
  const { login, loading } = useAuthContext();
  const [showPass, setShowPass] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className={styles.form}
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        try {
          await login(username.trim(), password);
        } catch (err: any) {
          setError(err?.response?.data?.message ?? "No se pudo iniciar sesión.");
        }
      }}
    >
      <label className={styles.field}>
        <span>Usuario</span>
        <div className={styles.inputWrapper}>
          <User2 aria-hidden className={styles.iconLeft} />
          <input
            type="text"
            placeholder="Ingresa tu usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
      </label>

      <label className={styles.field}>
        <span>Contraseña</span>
        <div className={styles.inputWrapper}>
          <Lock aria-hidden className={styles.iconLeft} />
          <input
            type={showPass ? "text" : "password"}
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPass((v) => !v)}
          >
            {showPass ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="submit" className={styles.loginBtn} disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar al Sistema"}
        </button>
      </div>
    </form>
  );
}
