// Reduce una imagen elegida por el usuario a un lado máximo (por defecto 256 px) y la devuelve como data URL.
// Se guarda dentro de los datos de la app (localStorage), así entra en Exportar e Importar copia.
export async function reducir(file, max = 256) {
  if (!file || !/^image\//.test(file.type)) throw new Error('No es una imagen');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => mal(new Error('Imagen ilegible')); i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    let d = c.toDataURL('image/webp', 0.85);                  // Safari no genera webp: en ese caso cae a png
    if (!d.startsWith('data:image/webp')) d = c.toDataURL('image/png');
    return d;
  } finally { URL.revokeObjectURL(url); }
}
