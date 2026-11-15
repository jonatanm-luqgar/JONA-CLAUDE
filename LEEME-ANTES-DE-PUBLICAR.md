# JONA OS · Paquete integrado (v2: sincronización automática)

## Qué cambió
- `shared/jona-cloud.js`: **un único núcleo Firebase** para PMI, Agenda y RPG (misma config, mismo SDK 10.14.1,
  mismo login anónimo persistente, caché offline y detección automática de long-polling para Chrome iOS/Android).
- **Agenda**: ya no depende de una clave guardada en cada dispositivo (esa era la causa de que PC/Safari fueran
  distintos de Chrome/tablet). Usa siempre `jona-os-shared`. Los datos de una clave antigua se copian solos una vez.
  Se corrigió que los bloques/tareas borrados reaparecían (se guardaba con merge).
- **RPG**: sin modal ni JSON de configuración; conexión automática. Se corrigió la API key con error tipográfico,
  y que un dispositivo con datos viejos pisara la nube (ahora gana la revisión más reciente `_rev`).
- **PMI**: misma lógica, ahora sobre el núcleo común.
- Portal: indicador real de conexión.

## Despliegue
1. Firebase Console > Authentication > Sign-in method: **Anonymous** activado.
2. Firebase Console > Firestore > Rules: pega `firestore.rules` y publica (cambió la ruta de agenda).
3. Firebase Console > Authentication > Settings > **Authorized domains**: debe incluir tu dominio `usuario.github.io`.
4. Google Cloud Console > APIs y servicios > Credenciales: si la API key de PMI tiene restricción de referrer,
   permite `https://TU-USUARIO.github.io/*`.
5. Sube TODO el contenido (incluida la carpeta `shared/`) a GitHub y espera el despliegue de Pages.
6. En cada dispositivo, recarga una vez (en iPhone/tablet cierra y reabre la pestaña) para evitar caché vieja.

## Seguridad
El acceso anónimo no verifica quién eres: cualquiera con el enlace puede leer/escribir. Úsalo solo para datos no sensibles.
