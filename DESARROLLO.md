# Arise — contexto de desarrollo

App personal de entrenamiento de Javier ("RED"), 20 años, kickboxer (cinturón amarillo, rendido en agosto 2026; examen en marzo 2027), desarrollador y estudiante. PWA offline, estilo "sistema holográfico" inspirado en Solo Leveling pero con identidad propia (cinturones, rojo y dorado). Idioma de la interfaz y del código visible: español rioplatense.

## Reglas de diseño (innegociables)
- Sin frameworks ni librerías externas. HTML, CSS y JS vanilla con módulos ES. Lo más liviano posible.
- Código limpio y modular. Un archivo por responsabilidad.
- Funciona offline: localStorage para datos, service worker para la app. IndexedDB solo para fotos (V3).
- El sitio vive en https://redmouse7112.github.io/arise/ (subruta) y los cambios se publican con push a `main`, así que **todas las rutas son relativas** (sin `/` inicial).
- Entregar archivos completos y listos; el usuario itera con feedback puntual y pide explicaciones solo si las necesita.
- Los datos viven solo en el dispositivo. Nada de servidores ni cuentas.

## Estructura
```
index.html            entrada, splash, nav, barra de temporizador
manifest.webmanifest  PWA
sw.js                 caché; subir la versión V al cambiar archivos
css/base.css          variables, fondo, layout, nav
css/ui.css            componentes (panel, botones, series, anillo, barra)
js/app.js             router por hash, toasts, barra global de temporizador
js/data.js            cinturones, imágenes, ejercicios (EX), sesiones (SESS), plan base
js/store.js           estado en localStorage ('arise.v1'), fechas, sesión por día
js/xp.js              XP, nivel, racha (se calcula desde el registro)
js/timer.js           cuenta regresiva / cronómetro con horas absolutas
js/ui.js              helpers de vistas
js/views/*.js         estado, hoy, plan, ejercicio
img/                  WebP optimizados (sec-* emblemas, mus-* músculos)
```

## Modelo de datos (`localStorage['arise.v1']`)
- `profile {belt, since, exam}`; `plan[0..6]` (domingo=0) con id de sesión; `over[fecha]` sesión elegida para ese día.
- `log[fecha] = { s: sesión congelada, ex: { id: { sets:[{w,r,d}], n, done, t } } }`.
- `last[id] = {w, r}` últimos valores; `prefs[id] = {dur, rest}` tiempos editados.
- Cambios de esquema: subir `v` y migrar en `load()`; nunca romper datos existentes.

## Reglas de XP
- Ejercicio hecho: `ex.xp` (25 normal, 15-40 cardio, 60 clase, 80 sparring, 40 descanso).
- Sesión completa (todos los no opcionales): `bonus` de la sesión.
- Nivel = floor(sqrt(xp/60)) + 1. Racha = días con sesión completa; un descanso planificado no marcado no corta la racha.
- **Sin penalizaciones.** Descansar suma XP. El usuario tiende a comer poco: la alerta de proteína baja (V2) debe ser amable.

## Cómo extender
- Nuevo ejercicio: agregar en `EX` (`E(id, nombre, {...})`) y en `ex` de las sesiones que correspondan. Tipos: `sets`, `timed`, `check`.
- Nueva sesión: agregar en `SESS` (con `img`, `color`, `bonus`, `ex`) y, si corresponde, en el plan base.
- Nueva pantalla: crear `js/views/x.js` con `render(root, ctx, arg)` (puede devolver una función de limpieza), registrarla en `VIEWS` y en `nav` de `app.js`.
- `ctx.commit()` después de cambiar progreso (calcula y muestra +XP / subida de nivel). `ctx.refresh()` re-renderiza.
- Al agregar archivos nuevos, sumarlos a `CORE` en `sw.js` y subir `V`.

## Estado de imágenes
- Emblemas de sección y músculos de Dorsales, Hombros, Deltoide posterior, Pecho y Bíceps: **hechos con Gemini/ChatGPT** (calidad final).
- **Provisionales** (hechos por composición sobre las figuras base, a reemplazar): `sec-lectura`, `mus-core`, `mus-cuadriceps`, `mus-isquios`, `mus-agarre`.
- **Faltante**: Pantorrillas. Hoy `MUS.pantorrillas` apunta a `img/sec-gym.webp`; al tener `img/mus-pantorrillas.webp`, cambiar la ruta en `js/data.js`. Se pide a Gemini: vista trasera de piernas completas con las pantorrillas resaltadas, mismo estilo que los demás.
- Convertir nuevas imágenes a WebP (≈512 px emblemas, ≈720 px músculos, calidad 80) para mantener la app liviana.

## Pendiente y hoja de ruta
**Datos por confirmar con el usuario**
- Plan base: Lunes/Martes/Jueves Dojo, Miércoles Gym 1, Viernes Sparring, Sábado Gym 2, Domingo Descanso (supuesto, editable).
- Series, repeticiones y pesos de Gym 2 (peso muerto rumano, sentadilla dividida, puente) son estimados.
- Pesos de Gym 1 conocidos: curl 12 kg, laterales 10 kg, banca 15 kg, press militar 12 kg por lado (subir a 14 con 8 limpias), remo 16 kg (probó 21 kg), farmer's walk 12 kg por lado × 50 m. Meta general: 87 kg, abdomen marcado, ~2.600 kcal, ~180 g de proteína.

**V2**
- Trote (con intervalos), Calistenia, Dojo y diario de Sparring (qué salió bien / qué falló; rondas de 3 min con descanso de 1 min).
- Comida: proteína del día contra meta (~180 g), alimentos rápidos, aviso amable si va baja.
- Lectura: libro actual y páginas por día.
- Sugerencia automática de subir peso al cumplir las repeticiones máximas en todas las series.
- Editar series, repeticiones y descanso por ejercicio desde la app.

**V3**
- Cuerpo: peso, medidas y fotos de progreso (IndexedDB) con gráficos simples.
- Atributos de peleador: Pegada, Guardia, Movilidad, Recuperación (derivados del registro).
- Rangos de cinturón con hitos y examen; historial y calendario.
- Mejorar el aviso de fin de temporizador (limitado: con el celular bloqueado, sonido y vibración pueden no funcionar en una web app sin servidor).

## Pruebas
- Servir con `python3 -m http.server` y probar en viewport móvil (390×844) y escritorio. Revisar consola sin errores, offline (service worker) y persistencia al recargar.
