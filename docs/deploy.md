# Deploy en Netlify

Cuándo leerlo: antes de publicar o si un deploy no aparece / falla. Movido desde CLAUDE.md.

**Netlify** (sitio `catalysis-site` → `catalysis.com.mx`) es el destino de producción.

**La rama de deploy es `production`, NO `main`.** `git push origin main` sube a
GitHub pero no dispara ningún build — hay que además llevar `production` al
día (`git push origin main:production` si `production` está estrictamente
detrás, o mergear si no). Se confirmó esto el 2026-08-18: hubo 4 commits en
`main` (incl. la integración con Catalysis CRM) sin desplegar durante días
porque el push solo llegó a `main`. Verificar con `netlify api
listSiteDeploys --data '{"site_id":"<id>"}'` cuál fue el último commit
realmente publicado, no asumir por el estado de `main`.

```bash
netlify deploy --prod
```

O por integración Git (push a `production`). Configuración mínima ya está en `netlify.toml`. **No** usar `firebase deploy` para hosting — el `firebase.json` está solo para desplegar reglas de Firestore.

**Secret scanner de Netlify:** si un archivo del repo (docs, `.env.example`,
etc.) contiene el **valor literal** de una env var configurada en el sitio —
aunque esa variable no sea sensible, como una URL pública — el build falla
con `Build script returned non-zero exit code: 2` (ver
`deploy_validations_report.secret_scan_result` en el deploy vía la API de
Netlify). Pasó con `CRM_LEADS_ENDPOINT`. Evitar escribir el valor exacto de
cualquier env var del sitio en archivos versionados; usar placeholders o
describirlo sin el string completo.

