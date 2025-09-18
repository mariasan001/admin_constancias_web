// src/lib/apis.ts
import axios from "axios";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4040";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  // Si tu backend usa nombres distintos para CSRF, descomenta y ajusta:
  // xsrfCookieName: "XSRF-TOKEN",
  // xsrfHeaderName: "X-XSRF-TOKEN",
});

// ========= REQUEST LOG (crear analista) =========
api.interceptors.request.use((config) => {
  const url = (config?.url || "").toString();

  // Log exclusivo para crear analista
  if (/\/api\/users\/analysts\/create$/.test(url) && typeof window !== "undefined") {
    try {
      const body =
        typeof config.data === "string" ? JSON.parse(config.data) : config.data;

      console.log(
        "%c[REQUEST] POST " + url,
        "color:#9F2141;font-weight:bold"
      );
      console.log(JSON.stringify(body, null, 2));

      // Curl listo por si quieres probar en terminal
      const curl = `curl -X POST '${API_BASE}/api/users/analysts/create' \
  -H 'Content-Type: application/json' \
  --cookie-jar cookies.txt --cookie cookies.txt \
  -d '${JSON.stringify(body)}'`;
      console.log("%c[curl]", "color:#777", curl);
    } catch (err) {
      console.warn("No se pudo imprimir payload de createAnalyst:", err);
    }
  }

  return config;
});

// ========= RESPONSE HANDLING =========
// Endpoints que SÍ justifican cierre de sesión si devuelven 401
const AUTH_ENDPOINTS_REGEX = /\/auth\/(me|login|refresh|logout)$/i;

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    const url = (error?.config?.url || "").toString();

    // Log robusto
    console.error("[API ERROR]", {
      url,
      method: error?.config?.method,
      status,
      data: error?.response?.data,
      headers: error?.response?.headers,
    });

    // Solo expulsamos si:
    //  - timeout/expired explícito
    //  - o 401 en endpoints de sesión
    if (typeof window !== "undefined") {
      if (status === 419 || status === 440) {
        window.dispatchEvent(new CustomEvent("auth:expired"));
      } else if (status === 401 && AUTH_ENDPOINTS_REGEX.test(url)) {
        window.dispatchEvent(new CustomEvent("auth:expired"));
      }
    }

    return Promise.reject(error);
  }
);

export default api; 