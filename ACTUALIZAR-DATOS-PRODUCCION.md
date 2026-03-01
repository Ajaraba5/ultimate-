# Actualizar datos en producción (Render) desde tu PC

Sí, puedes actualizar la base desde tu PC y se refleja en producción de inmediato.

## Opción recomendada (sin consola): desde el panel Admin web

1. Entra a tu URL de Render (producción).
2. Inicia sesión como admin.
3. Ve a importación y sube el Excel (Nello con partido VERDE, Oscar con partido ROJO).
4. Ejecuta asignación automática por sede (si usas botón/API de asignación).

Resultado: al terminar importación + asignación, la base de producción queda actualizada en vivo.

---

## Opción por API (desde tu PC con curl)

## 1) Login admin para obtener token

```bash
curl -X POST "https://TU-APP.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'
```

Guarda el `token` del JSON.

## 2) Importar Excel VERDE

```bash
curl -X POST "https://TU-APP.onrender.com/api/data/import" \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "file=@BASE NUEVA DE NELLO ZABARAIN 2026.xlsx" \
  -F "partido=VERDE"
```

## 3) Importar Excel ROJO

```bash
curl -X POST "https://TU-APP.onrender.com/api/data/import" \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "file=@NUEVA BASE OSCAR GALAN 10-02-2026 -2.xlsx" \
  -F "partido=ROJO"
```

## 4) Reasignar contadores por sede

```bash
curl -X POST "https://TU-APP.onrender.com/api/admin/asignar-personas" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"autoBySede":true,"passwordDefecto":"Contador123!"}'
```

---

## Importante sobre "actualiza solo"

- **Código**: sí, se actualiza solo con `git push` (autoDeploy).
- **Datos (Excel)**: no se suben solos con `git push`; debes importarlos desde panel o API.

Eso sí: una vez haces el import por panel/API, el cambio pega al instante en producción.
