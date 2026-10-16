# Arise — contexto de desarrollo

App personal de entrenamiento de Javier ("RED"), 20 años, kickboxer (cinturón amarillo, rendido en agosto 2026; examen en marzo 2027), desarrollador y estudiante. PWA offline, estilo "sistema holográfico" inspirado en Solo Leveling pero con identidad propia (cinturones, rojo y dorado). Idioma de la interfaz y del código visible: español rioplatense.

## Reglas de diseño (innegociables)
- Sin frameworks ni librerías externas. HTML, CSS y JS vanilla con módulos ES. Lo más liviano posible.
- Código limpio y modular. Un archivo por responsabilidad.
- Funciona offline: localStorage para datos, service worker para la app. IndexedDB solo para fotos (V3).
- El sitio vive en https://redmouse7112.github.io/arise/ (subruta) y los cambios se publican con push a `main`, así que **todas las rutas son relativas** (sin `/` inicial).
- Entregar archivos completos y listos; el usuario itera con feedback puntual y pide explicaciones solo si las necesita.
- Los datos viven solo en el dispositivo. Nada de servidores ni cuentas.
- Los commits y pull requests son solo del autor del repositorio, sin firmas ni coautores.

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
js/habitos.js         datos de Comida y Lectura (proteína, libros, páginas, XP); sin interfaz
js/entreno.js         datos de trote, dojo y diario de sparring; sin interfaz
js/novedades.js       registro de cambios para el usuario (NOVEDADES); js/aviso.js: ventana de novedades
js/modal.js           ventana pequeña centrada reutilizable (`abrirModal`)
js/instalar.js        botón de instalación (beforeinstallprompt), pasos para iOS y ayuda por navegador
js/timer.js           cuenta regresiva / cronómetro con horas absolutas
js/ui.js              helpers de vistas
js/views/*.js         estado, hoy, comida, lectura, mas, plan, ejercicio, novedades,
                      historial (trote), diario (sparring); pantallas propias de ejercicio: trote, clase, spar
img/                  WebP optimizados (sec-* emblemas, mus-* músculos)
```

## Modelo de datos (`localStorage['arise.v1']`, esquema `v: 3`)
- `profile {belt, since, exam}`; `plan[0..6]` (domingo=0) con id de sesión; `over[fecha]` sesión elegida para ese día.
- `log[fecha] = { s: sesión congelada, ex: { id: { sets:[{w,r,d}], n, done, t } } }`.
- `last[id] = {w, r}` últimos valores; `prefs[id] = {dur, rest}` tiempos editados.
- `food {goal, kcal, quick:[{id,n,g}], log:{fecha:[{n,g,t}]}, gl:{fecha:meta}}`: `g` = gramos de proteína; `gl` congela la meta del día al cargar la primera comida.
- `read {goal, current, books:[{id,t,a,pages,cur,done}], log:{fecha:{pages,min}}, gl:{fecha:meta}}`: `done` = fecha en que se terminó (o null); `current` = id del libro actual.
- `run {log:{fecha:{mode:'cont'|'int', min, km, feel}}}`; `dojo {log:{fecha:{type, effort, notes}}}`; `spar {log:[{id, date, rounds, feel, good, bad, work}]}`.
- Migración en `store.js` (`migrate`): conserva todo y agrega lo que falte; antes de migrar guarda una copia de los datos previos en `arise.v1.bak<versión>` (`bak1`, `bak2`).
- Aparte del estado principal: `arise.seen` (última versión de novedades vista) y `arise.timer` (temporizador activo).
- Cambios de esquema: subir `v` y migrar en `load()`; nunca romper datos existentes.

## Reglas de XP
- Ejercicio hecho: `ex.xp` (25 normal, 15-40 cardio, 60 clase, 80 sparring, 40 descanso).
- Sesión completa (todos los no opcionales): `bonus` de la sesión.
- Nivel = floor(sqrt(xp/60)) + 1. Racha = días con sesión completa; un descanso planificado no marcado no corta la racha.
- Comida: +30 XP por día con proteína ≥ 90 % de la meta de ese día. Lectura: +20 XP por día con páginas ≥ meta y +100 XP por libro terminado. Se calculan desde el registro (`foodXP`, `readXP`), suman a `totalXP()` pero no cuentan para la racha ni la sesión completa.
- Trote: además de `ex.xp` (40), +1 XP por cada 2 min por encima de 20, tope +20 (`runBonus`). Solo cuenta si la sesión del día incluye el trote.
- **Sin penalizaciones.** Descansar suma XP. El usuario tiende a comer poco: la alerta de proteína baja (V2) debe ser amable.

## Cómo extender
- Nuevo ejercicio: agregar en `EX` (`E(id, nombre, {...})`) y en `ex` de las sesiones que correspondan. Tipos: `sets`, `timed`, `check`.
- Nueva sesión: agregar en `SESS` (con `img`, `color`, `bonus`, `ex`) y, si corresponde, en el plan base.
- Nueva pantalla: crear `js/views/x.js` con `render(root, ctx, arg)` (puede devolver una función de limpieza), registrarla en `VIEWS` y en `nav` de `app.js`.
- `ctx.commit()` después de cambiar progreso (calcula y muestra +XP / subida de nivel). `ctx.refresh()` re-renderiza.
- Al agregar archivos nuevos, sumarlos a `CORE` en `sw.js` y subir `V`.
- Instalación: `instalar.js` guarda el evento `beforeinstallprompt`; la tarjeta de Estado se puede descartar (`arise.instalar`) y la entrada de Más queda. Todo se oculta si la app ya corre instalada (`display-mode: standalone`). Sin el evento (iOS, Firefox, otros) muestra instrucciones según el navegador detectado; solo incluir pasos que existan de verdad.
- iOS (iPhone/iPad, PWA desde iOS 16.4): no hay `beforeinstallprompt`; `instalar.js` detecta iOS (también iPadOS como Mac táctil) y muestra los pasos de Safari (Compartir → Agregar a inicio) o pide abrir en Safari si es otro navegador. Metadatos `apple-*` e ícono 180×180 sin transparencia (`icons/apple-touch-icon.png`) en `index.html`. `navigator.vibrate` no existe en iOS: el fin de temporizador debe apoyarse en sonido y efecto visual, y ningún texto promete vibración. El sonido (Web Audio) puede quedar silenciado por el interruptor de silencio del iPhone. Al iniciar se pide `navigator.storage.persist()`. Los campos de texto usan 16 px en iOS para evitar el zoom al enfocar. No hay pruebas automáticas en WebKit/iPhone: probar a mano en un dispositivo real.
- Ejercicio con pantalla propia: crear `js/views/x.js` y registrarlo en `SPECIAL` de `app.js` (clave = id del ejercicio).
- Temporizador por fases: `T.startPhases([{label, ms, round?, rounds?, warn?}], meta)`. `meta.kind` ('ex', 'read', 'run', 'spar') decide qué hace `app.js` al terminar; `meta.exId` oculta la barra global en esa pantalla.
- **Regla permanente:** en cada entrega, subir `APP_VERSION` según la sección "Versionado" y agregar su entrada arriba en `js/novedades.js`, escrita para el usuario final (3 a 5 viñetas, lenguaje simple). La ventana aparece una sola vez por versión. Lógica en `js/aviso.js`: instalación nueva = sin registros ni copias `arise.v1.bak*` (no se muestra); con datos y sin `arise.seen` cuenta como `0.0.0` (se muestra); las versiones se comparan como números (`cmpVer`). Más → Novedades permite volver a ver la última.

## Estado de imágenes
- Emblemas de sección y músculos de Dorsales, Hombros, Deltoide posterior, Pecho y Bíceps: **hechos con Gemini/ChatGPT** (calidad final).
- **Provisionales** (hechos por composición sobre las figuras base, a reemplazar): `sec-lectura`, `mus-core`, `mus-cuadriceps`, `mus-isquios`, `mus-agarre`.
- **Faltante**: Pantorrillas. Hoy `MUS.pantorrillas` apunta a `img/sec-gym.webp`; al tener `img/mus-pantorrillas.webp`, cambiar la ruta en `js/data.js`. Se pide a Gemini: vista trasera de piernas completas con las pantorrillas resaltadas, mismo estilo que los demás.
- Convertir nuevas imágenes a WebP (≈512 px emblemas, ≈720 px músculos, calidad 80) para mantener la app liviana.

## Versionado
`APP_VERSION` (en `js/data.js`) usa **MAYOR.MENOR.PARCHE**:
- **Parche**: correcciones sin funciones nuevas.
- **Menor**: cada entrega de funciones dentro de una fase.
- **Mayor**: una fase completa nueva o un cambio que altere cómo se usa la app.

| Entrega | Versión |
|---|---|
| V1 | 1.0.0 |
| V2a | 2.0.0 |
| V2b | 2.1.0 |
| Arreglo de novedades | 2.1.1 |
| V2c | 2.2.0 |
| V3 | 3.0.0 |

El `v` del esquema de datos (`localStorage`) es **independiente** de `APP_VERSION`: solo sube cuando cambia la forma de los datos guardados y se migra en `load()`.

En cada entrega: subir `APP_VERSION` según esta regla y agregar su entrada arriba en `js/novedades.js`.

## Pendiente y hoja de ruta
**Datos por confirmar con el usuario**
- Plan base: Lunes/Martes/Jueves Dojo, Miércoles Gym 1, Viernes Sparring, Sábado Gym 2, Domingo Descanso (supuesto, editable).
- Series, repeticiones y pesos de Gym 2 (peso muerto rumano, sentadilla dividida, puente) son estimados.
- Pesos de Gym 1 conocidos: curl 12 kg, laterales 10 kg, banca 15 kg, press militar 12 kg por lado (subir a 14 con 8 limpias), remo 16 kg (probó 21 kg), farmer's walk 12 kg por lado × 50 m. Meta general: 87 kg, abdomen marcado, ~2.600 kcal, ~180 g de proteína.

**V2a (hecha)**
- Comida: proteína del día contra meta (180 g), alimentos rápidos editables, aviso amable, gráfico de 7 días, XP.
- Lectura: libros, páginas del día, estimación de días, cronómetro "Leer 20 min" (kind `read`), XP.
- Navegación de 5 ítems; tarjetas de proteína y lectura en Estado y Misión.

**V2b (hecha, v2.1.0)**
- Trote continuo e intervalos (1:1×10, 2:1×8, 3:1×6, personalizado) con registro de km y sensación; historial.
- Sesión Calistenia (elegible en Plan y Misión; no está en el plan base). Plancha es `timed` con `step` de 15 s.
- Clase en Spartans con tipo, esfuerzo y notas; asistencias de semana y mes.
- Sparring: rondas 3 min + 1 min de descanso con aviso a los 10 s; diario editable; "A trabajar" arriba en Misión el día de sparring.
- Barra de 5 ítems (Estado, Misión, Comida, Lectura, Más); `#/mas` lleva a Plan, Diario, Historial de trote, Ajustes y Novedades.
- Ventana de novedades y versión de la app (Estado → Ajustes).

**V2c (falta)**
- Editar series, repeticiones y descanso por ejercicio desde la app (incluye la calistenia).
- Sugerencia automática de subir peso al cumplir las repeticiones máximas en todas las series.

**V3**
- Cuerpo: peso, medidas y fotos de progreso (IndexedDB) con gráficos simples.
- Atributos de peleador: Pegada, Guardia, Movilidad, Recuperación (derivados del registro).
- Rangos de cinturón con hitos y examen; historial y calendario.
- Mejorar el aviso de fin de temporizador (limitado: con el celular bloqueado, el sonido puede no funcionar en una web app sin servidor, y iOS no tiene vibración).

## Pruebas
- Servir con `python3 -m http.server` y probar en viewport móvil (390×844) y escritorio. Revisar consola sin errores, offline (service worker) y persistencia al recargar.
