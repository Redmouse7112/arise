# Dankai

Tu sistema de entrenamiento personal. PWA offline sin frameworks.

## Probar en local
Los módulos JS y el service worker necesitan `http`, no funcionan abriendo `index.html` con doble clic.

```bash
cd app
python -m http.server 8000
```
Abrí http://localhost:8000

## Sitio
App: https://redmouse7112.github.io/arise/ · Repo: https://github.com/Redmouse7112/arise

Abrila en el celular y usá **Agregar a la pantalla de inicio** para instalarla.

## Actualizar
Después de cualquier cambio: subir la versión `V` en `sw.js` (por ejemplo `arise-v4-4`; el prefijo `arise-` del caché es legado y solo es un identificador), luego `git add . && git commit -m "..." && git push` a `main`. Si el celular muestra la versión vieja, cerrá y abrí la app una vez.

## Nombre
La app se llama **Dankai** (段階, "etapa" o "peldaño"). El repositorio y la dirección de GitHub Pages siguen usando `arise` hasta que se decida renombrarlos.

## Copia de seguridad
Los datos quedan solo en tu dispositivo. En **Estado → Ajustes → Exportar copia** descargás un archivo (`dankai-backup-AAAA-MM-DD.json`) que podés importar después. También se importan las copias viejas `arise-*.json`.

## Desarrollo: ver DESARROLLO.md
Está en `DESARROLLO.md`: tiene la arquitectura, las reglas, el modelo de datos y la hoja de ruta de las próximas versiones.
