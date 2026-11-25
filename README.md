# Data Zentryx Email Marketing

Sistema de envío masivo de correos con marca Data Zentryx. Basado en la app de referencia, adaptado con estilo propio y soporte SMTP genérico vía Nodemailer.

## Variables de entorno
Ver `.env.example`. Define `DASHBOARD_PASSWORD` en `.env.local` antes de iniciar la aplicación; no hay una contraseña predeterminada.

## Desarrollo
```bash
npm install
npm run dev
```

## Despliegue
Puede desplegarse en Vercel. Configura las variables de entorno en el proyecto:

- Añade `DASHBOARD_PASSWORD` en **Project Settings → Environment Variables** para **Production** y, si usas previews, también para **Preview**.
- Define el mismo valor que en `.env.local` si deseas usar la misma contraseña local y publicada. Vercel no lee el `.env.local` de tu computadora.
- Después de guardar o cambiar la variable, crea un nuevo despliegue para que las funciones utilicen el valor actualizado.
- No pongas la contraseña en el repositorio, en el código del navegador ni en los logs.
