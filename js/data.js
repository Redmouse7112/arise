// Datos estáticos de Arise: cinturones, imágenes, ejercicios y sesiones.
export const APP_VERSION = '2.1.3';

export const BELTS = [
  { id: 'blanco',   n: 'Blanco',   c: '#f1f5f9' },
  { id: 'amarillo', n: 'Amarillo', c: '#fbbf24' },
  { id: 'naranja',  n: 'Naranja',  c: '#fb923c' },
  { id: 'verde',    n: 'Verde',    c: '#34d399' },
  { id: 'azul',     n: 'Azul',     c: '#38bdf8' },
  { id: 'marron',   n: 'Marrón',   c: '#c08457' },
  { id: 'negro',    n: 'Negro',    c: '#94a3b8' },
];

export const IMG = {
  logo: 'img/logo.webp',
  gym: 'img/sec-gym.webp', calistenia: 'img/sec-calistenia.webp', trote: 'img/sec-trote.webp',
  sparring: 'img/sec-sparring.webp', comida: 'img/sec-comida.webp', cuerpo: 'img/sec-cuerpo.webp',
  lectura: 'img/sec-lectura.webp', dojo: 'img/sec-dojo.webp',
};

// Músculo -> [nombre, imagen]. Si falta la imagen se usa el emblema de la sección.
export const MUS = {
  dorsales:  ['Dorsales y espalda', 'img/mus-dorsales.webp'],
  hombros:   ['Hombros', 'img/mus-hombros.webp'],
  deltoide:  ['Deltoide posterior', 'img/mus-deltoide.webp'],
  pecho:     ['Pecho', 'img/mus-pecho.webp'],
  biceps:    ['Bíceps y antebrazo', 'img/mus-biceps.webp'],
  core:      ['Core y abdomen', 'img/mus-core.webp'],
  cuadriceps:['Cuádriceps', 'img/mus-cuadriceps.webp'],
  isquios:   ['Isquios y glúteos', 'img/mus-isquios.webp'],
  agarre:    ['Agarre y trapecios', 'img/mus-agarre.webp'],
  pantorrillas: ['Pantorrillas', 'img/sec-gym.webp'], // provisional: cambiar por img/mus-pantorrillas.webp cuando esté
  cardio:    ['Cardio', 'img/sec-trote.webp'],
};

const E = (id, n, o = {}) => ({ id, n, type: 'sets', sets: 3, reps: '8-10', rl: 'reps', rest: 90, xp: 25, ...o });

// type: 'sets' (peso x reps) | 'timed' (cuenta regresiva) | 'check' (un toque)
export const EX = {
  bici:     E('bici', 'Bici · calentamiento', { type: 'timed', dur: 600, xp: 15, muscle: 'cardio', note: 'Ritmo suave, que puedas hablar. Prepara hombros y espalda.' }),
  jalon:    E('jalon', 'Jalón al pecho', { sets: 4, reps: '6-8', muscle: 'dorsales', note: 'Antes de las series de trabajo, hacé 1 o 2 series livianas.', prog: 'Si hacés 8 limpias en todas las series, subí el peso.' }),
  remo:     E('remo', 'Remo con mancuerna', { sets: 4, reps: '8-10', muscle: 'dorsales', note: 'Por lado, empezá por el derecho. Sin balancear el torso.', prog: 'Con 10 limpias en todas las series, subí el peso.' }),
  pressmil: E('pressmil', 'Press militar', { reps: '6-8', muscle: 'hombros', note: 'Peso por mancuerna.', prog: 'Con 8 limpias en las 3 series, subí a 14 kg por lado.' }),
  banca:    E('banca', 'Press banca liviano', { reps: '6-8', muscle: 'pecho', note: 'Liviano, sin ir al fallo.' }),
  facepull: E('facepull', 'Face pulls', { reps: '15', rest: 60, muscle: 'deltoide', note: 'Codos altos, apretá la espalda alta.' }),
  laterales:E('laterales', 'Elevaciones laterales', { reps: '12-15', rest: 60, muscle: 'hombros', note: 'Sin impulso del cuerpo. Si te ayudás con el tronco, bajá el peso.' }),
  curl:     E('curl', 'Curl de bíceps', { reps: '10-12', rest: 60, muscle: 'biceps' }),
  farmer:   E('farmer', "Farmer's walk", { reps: '30', rl: 'm', rest: 60, muscle: 'agarre', note: 'Mancuernas a los costados, hombros atrás. Hacela al final para cuidar el agarre.' }),
  gemelos:  E('gemelos', 'Gemelos', { sets: 2, reps: '12-15', rest: 45, muscle: 'pantorrillas' }),
  crunch:   E('crunch', 'Crunch en polea', { reps: '10-15', rest: 60, muscle: 'core', note: 'Con carga. Redondeá la espalda, no tires con los brazos.' }),
  piernas:  E('piernas', 'Elevación de piernas', { reps: '10-15', rest: 60, muscle: 'core', note: 'Controlá la bajada.' }),
  rdl:      E('rdl', 'Peso muerto rumano', { reps: '6-8', rest: 120, muscle: 'isquios', note: 'Espalda neutra, cadera hacia atrás.' }),
  split:    E('split', 'Sentadilla dividida', { reps: '8-10', muscle: 'cuadriceps', note: 'Por pierna.' }),
  puente:   E('puente', 'Puente de glúteo', { reps: '10-12', muscle: 'isquios', note: 'Pausa de 1 segundo arriba.' }),
  biciFin:  E('biciFin', 'Bici · final (opcional)', { type: 'timed', dur: 900, xp: 20, opt: true, muscle: 'cardio', note: 'Reemplaza al trote. Suave; si venís cansado, bajala a 10 min.' }),
  dominadas:E('dominadas', 'Dominadas o negativas', { sets: 4, reps: '3-6', rest: 120, muscle: 'dorsales', note: 'Si todavía no salen completas, hacé negativas: subí con un salto y bajá en 3 a 5 segundos.' }),
  flexiones:E('flexiones', 'Flexiones', { sets: 4, reps: '10-15', rest: 75, muscle: 'pecho', note: 'Cuerpo en línea recta, pecho cerca del piso.' }),
  fondos:   E('fondos', 'Fondos en paralelas o banco', { reps: '8-12', rest: 90, muscle: 'hombros', note: 'Bajá controlado, sin encoger los hombros.' }),
  remoinv:  E('remoinv', 'Remo invertido', { reps: '8-12', rest: 90, muscle: 'biceps', note: 'Cuerpo recto, llevá el pecho hacia la barra.' }),
  plancha:  E('plancha', 'Plancha', { type: 'timed', dur: 45, step: 15, rounds: 3, xp: 25, muscle: 'core', note: 'Hacé 3 series de 45 s, con 45 s de descanso entre una y otra. Repetí el temporizador.' }),
  piernascol:E('piernascol', 'Elevación de piernas colgado', { reps: '8-12', rest: 60, muscle: 'core', note: 'Colgado de la barra, sin balancearte.' }),
  trote:    E('trote', 'Trote suave', { type: 'timed', dur: 1200, xp: 40, muscle: 'cardio', note: 'Ritmo en el que puedas hablar. Si estás muy cansado, caminá.' }),
  clase:    E('clase', 'Clase en Spartans', { type: 'check', xp: 60, muscle: 'cardio' }),
  spar:     E('spar', 'Sparring', { type: 'check', xp: 80, muscle: 'cardio' }),
  descanso: E('descanso', 'Descanso y recuperación', { type: 'check', xp: 40, muscle: 'cardio', note: 'Dormir, comer bien e hidratarte también es entrenar.' }),
};

export const SESS = {
  gym1: { n: 'Gym 1 · Tirón y hombros', img: 'gym', color: '#38bdf8', bonus: 60,
          ex: ['bici', 'jalon', 'remo', 'pressmil', 'banca', 'facepull', 'laterales', 'curl', 'farmer', 'gemelos', 'crunch', 'piernas', 'biciFin'] },
  gym2: { n: 'Gym 2 · Cadera y piernas', img: 'gym', color: '#38bdf8', bonus: 60,
          ex: ['bici', 'rdl', 'split', 'puente', 'farmer', 'gemelos', 'crunch', 'piernas', 'biciFin'] },
  calistenia: { n: 'Calistenia', img: 'calistenia', color: '#a78bfa', bonus: 50,
                ex: ['dominadas', 'flexiones', 'fondos', 'remoinv', 'plancha', 'piernascol'] },
  trote:{ n: 'Trote', img: 'trote', color: '#fbbf24', bonus: 15, ex: ['trote'] },
  dojo: { n: 'Dojo · Spartans', img: 'dojo', color: '#fbbf24', bonus: 0, ex: ['clase'] },
  sparring: { n: 'Sparring', img: 'sparring', color: '#ef4444', bonus: 0, ex: ['spar'] },
  descanso: { n: 'Descanso', img: 'cuerpo', color: '#cbd5e1', bonus: 0, ex: ['descanso'] },
};

// Domingo(0)..Sábado(6). Editable desde la pantalla Plan.
export const DEFAULT_PLAN = ['descanso', 'dojo', 'dojo', 'gym1', 'dojo', 'sparring', 'gym2'];
export const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Últimos pesos conocidos (sesión del 15/10/2026). No se inventan repeticiones.
export const SEED_LAST = {
  curl: { w: 12 }, laterales: { w: 10 }, banca: { w: 15 }, pressmil: { w: 12 },
  remo: { w: 16 }, farmer: { w: 12, r: 50 }, rdl: { w: 85 },
};

export const TITLES = [[1, 'Aspirante'], [5, 'Peleador'], [10, 'Guerrero'], [15, 'Espartano'], [25, 'Maestro']];
