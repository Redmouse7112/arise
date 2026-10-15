# Arise

Tu sistema de entrenamiento personal. PWA offline sin frameworks.

## Probar en local
Los módulos JS y el service worker necesitan `http`, no funcionan abriendo `index.html` con doble clic.

```bash
cd app
python -m http.server 8000
```
Abrí http://localhost:8000

## Subir a GitHub Pages
1. Crear un repositorio nuevo en GitHub (por ejemplo `arise`), sin README.
2. En la carpeta `app`:
```bash
git init
git add .
git commit -m "Arise V1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/arise.git
git push -u origin main
```
3. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root) → Save**.
4. En un minuto queda en `https://TU_USUARIO.github.io/arise/`.
5. Abrilo en el celular y usá **Agregar a la pantalla de inicio** para instalarla.

## Actualizar
Después de cualquier cambio: subir la versión `V` en `sw.js` (por ejemplo `arise-v1-2`), luego `git add . && git commit -m "..." && git push`. Si el celular muestra la versión vieja, cerrá y abrí la app una vez.

## Copia de seguridad
Los datos quedan solo en tu dispositivo. En **Estado → Ajustes → Exportar copia** descargás un archivo que podés importar después.

## Desarrollo: ver DESARROLLO.md
Está en `DESARROLLO.md`: tiene la arquitectura, las reglas, el modelo de datos y la hoja de ruta de las próximas versiones.
