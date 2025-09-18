'use client';

import LoginForm from '@/components/LoginForm';
import styles from '@/components/login.module.css';

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Panel izquierdo */}
        <div className={styles.leftPanel}>
          <div className={styles.leftContent}>
            <h1>¡Bienvenido de nuevo! 👋</h1>
            <p>
              Inicia sesión para acceder a tu panel, administrar tus actividades y seguir
              avanzando en tus proyectos. Siempre estamos aquí para apoyarte.
            </p>
          </div>
        </div>

        {/* Panel derecho */}
        <div className={styles.rightPanel}>
          <div className={styles.formWrap}>
            <div className={styles.logoBox}>
              {/* Archivo en: public/img/logo.png */}
              <img src="/img/logo.png" alt="Logo institucional" />
              {/* Si prefieres optimizar: 
              <Image src="/img/logo.png" alt="Logo institucional" width={170} height={48} priority /> */}
            </div>

            <h2 className={styles.title}>Iniciar Sesión</h2>
            <p className={styles.subtitle}>
              Accede con tu cuenta para continuar. Si tienes algún problema, no dudes en
              contactar al soporte.
            </p>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

