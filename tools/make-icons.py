#!/usr/bin/env python3
"""Genera los íconos de Dankai a partir de img/dankai-logo.svg (la fuente de verdad del logo).

QUÉ GENERA (todo se escribe sobre los archivos que usa la app):
  icons/icon-192.png         192x192, también es el favicon (index.html lo usa como <link rel="icon">)
  icons/icon-512.png         512x512
  icons/maskable-512.png     512x512 (el símbolo ya queda dentro de la zona segura del 80 %)
  icons/apple-touch-icon.png 180x180, sin transparencia (iOS)
  img/logo.webp              512x512 con fondo transparente (splash y encabezado de Estado)

CÓMO CORRERLO (desde la raíz del repositorio):
  pip install pillow            # única dependencia, y solo de esta herramienta
  python tools/make-icons.py                    # sobrescribe los archivos de la app
  python tools/make-icons.py --salida /tmp/x    # escribe en otra carpeta (icons/ e img/ adentro), para comparar

Para cambiar el logo: editar img/dankai-logo.svg (colores en las variables del inicio, formas dentro de <g id="escalones">)
y volver a correr este script. Pillow no sabe dibujar SVG, así que el script lee de ese archivo solo lo que el logo usa:
variables CSS de color, degradados lineales verticales, <path> con M, H, V, A (arcos circulares) y Z, <rect> con rx,
y el brillo (desenfoque y opacidad de #brillo). Si agregás formas más complejas, hay que ampliar el lector.

Esta herramienta NO forma parte de la app: no se carga desde ningún archivo de la app ni está en la lista de archivos del
service worker (sw.js, CORE), así que no se descarga ni se guarda para usar sin conexión.
"""
import argparse
import math
import os
import re
import xml.etree.ElementTree as ET

from PIL import Image, ImageChops, ImageDraw, ImageFilter

N = 1024        # lado del lienzo del SVG (viewBox)
SS = 3          # supermuestreo: se dibuja ×3 y se reduce, para bordes suaves
BRILLO_LOGO = 0.45   # intensidad del brillo en logo.webp (fondo transparente)
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
NS = '{http://www.w3.org/2000/svg}'


def hex_rgb(h):
    h = h.strip().lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lerp(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


class Svg:
    def __init__(self, ruta):
        self.arbol = ET.parse(ruta).getroot()
        css = ''.join(e.text or '' for e in self.arbol.iter(NS + 'style'))
        self.vars = {m.group(1): hex_rgb(m.group(2)) for m in re.finditer(r'--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})', css)}
        self.grad = {}
        for g in self.arbol.iter(NS + 'linearGradient'):
            self.grad[g.get('id')] = [(float(s.get('offset')), self.color(s.get('style') or s.get('stop-color'))) for s in g.iter(NS + 'stop')]
        blur = next(self.arbol.iter(NS + 'feGaussianBlur'))
        self.desenfoque = float(blur.get('stdDeviation'))
        brillo = next(e for e in self.arbol.iter() if e.get('id') == 'brillo')
        self.brillo = float(brillo.get('opacity', '0.35'))
        grupo = next(e for e in self.arbol.iter() if e.get('id') == 'escalones')
        self.formas = list(grupo)

    def color(self, txt):
        v = re.search(r'var\(--([\w-]+)\)', txt)
        if v:
            return self.vars[v.group(1)]
        return hex_rgb(re.search(r'#[0-9a-fA-F]{3,6}', txt).group(0))

    def relleno(self, el):
        """Devuelve ('grad', stops) o ('color', rgb) según el relleno de la forma."""
        f = (el.get('style') or '')
        m = re.search(r'fill\s*:\s*([^;]+)', f)
        f = m.group(1).strip() if m else (el.get('fill') or '')
        u = re.match(r'url\(#([\w-]+)\)', f)
        if u:
            return ('grad', self.grad[u.group(1)])
        return ('color', self.color(f))


def arco(p0, p1, r, barrido):
    """Puntos de un arco circular (radio r, arco chico) entre p0 y p1."""
    (x0, y0), (x1, y1) = p0, p1
    dx, dy = x1 - x0, y1 - y0
    d = math.hypot(dx, dy)
    h = math.sqrt(max(0.0, r * r - (d / 2) ** 2))
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    ux, uy = -dy / d, dx / d
    centros = [(mx + ux * h, my + uy * h), (mx - ux * h, my - uy * h)]
    # barrido=1 recorre el arco en sentido horario (y hacia abajo): elijo el centro que lo cumple
    cx, cy = next(c for c in centros if ((x0 - c[0]) * (y1 - c[1]) - (y0 - c[1]) * (x1 - c[0]) > 0) == bool(barrido))
    a0, a1 = math.atan2(y0 - cy, x0 - cx), math.atan2(y1 - cy, x1 - cx)
    da = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
    return [(cx + r * math.cos(a0 + da * k / 24), cy + r * math.sin(a0 + da * k / 24)) for k in range(1, 25)]


def poligono(d):
    """Convierte un <path d> con M, H, V, L, A y Z (coordenadas absolutas) en una lista de puntos."""
    t = re.findall(r'[MHVLAZ]|-?\d+\.?\d*', d)
    pts, i, cur, cmd = [], 0, (0.0, 0.0), None
    while i < len(t):
        if re.match(r'[MHVLAZ]', t[i]):
            cmd = t[i]; i += 1
            if cmd == 'Z':
                continue
        if cmd == 'M' or cmd == 'L':
            cur = (float(t[i]), float(t[i + 1])); i += 2; pts.append(cur)
        elif cmd == 'H':
            cur = (float(t[i]), cur[1]); i += 1; pts.append(cur)
        elif cmd == 'V':
            cur = (cur[0], float(t[i])); i += 1; pts.append(cur)
        elif cmd == 'A':
            r, sw = float(t[i]), int(t[i + 4])
            fin = (float(t[i + 5]), float(t[i + 6])); i += 7
            pts += arco(cur, fin, r, sw); cur = fin
        else:
            raise ValueError(f'Comando de path no soportado: {cmd}')
    return pts


def mascara_forma(el):
    m = Image.new('L', (N * SS, N * SS), 0)
    d = ImageDraw.Draw(m)
    if el.tag == NS + 'rect':
        x, y, w, h = (float(el.get(k)) for k in ('x', 'y', 'width', 'height'))
        d.rounded_rectangle([x * SS, y * SS, (x + w) * SS - 1, (y + h) * SS - 1], radius=float(el.get('rx', 0)) * SS, fill=255)
        return m, (y, y + h)
    pts = poligono(el.get('d'))
    d.polygon([(px * SS, py * SS) for px, py in pts], fill=255)
    ys = [p[1] for p in pts]
    return m, (min(ys), max(ys))


def simbolo(svg):
    """Dibuja los escalones y devuelve (imagen RGB, máscara) en el lienzo ampliado."""
    W = N * SS
    arte = Image.new('RGB', (W, W), (0, 0, 0))
    mascara = Image.new('L', (W, W), 0)
    for el in svg.formas:
        m, (y0, y1) = mascara_forma(el)
        tipo, val = svg.relleno(el)
        if tipo == 'color':
            capa = Image.new('RGB', (W, W), val)
        else:   # degradado vertical dentro de la caja de la forma (como objectBoundingBox)
            capa = Image.new('RGB', (W, W), val[-1][1])
            d = ImageDraw.Draw(capa)
            top, alto = int(y0 * SS), max(1, int((y1 - y0) * SS))
            for y in range(top, int(y1 * SS) + 1):
                t = min(1.0, max(0.0, (y - top) / alto))
                for (o0, c0), (o1, c1) in zip(val, val[1:]):
                    if o0 <= t <= o1:
                        d.line([(0, y), (W, y)], fill=lerp(c0, c1, (t - o0) / ((o1 - o0) or 1)))
                        break
        arte.paste(capa, (0, 0), m)
        mascara = ImageChops.lighter(mascara, m)
    return arte, mascara


def fondo(svg):
    W = N * SS
    g = svg.grad['fondo']
    img = Image.new('RGB', (W, W))
    d = ImageDraw.Draw(img)
    for y in range(W):
        d.line([(0, y), (W, y)], fill=lerp(g[0][1], g[-1][1], y / (W - 1)))
    return img


def icono(svg, arte, mascara):
    """Ícono opaco: fondo oscuro, brillo suave detrás y los escalones."""
    brillo = Image.composite(arte, Image.new('RGB', arte.size, (0, 0, 0)), mascara).filter(ImageFilter.GaussianBlur(svg.desenfoque * SS))
    brillo = Image.eval(brillo, lambda v: int(v * svg.brillo))
    out = ImageChops.add(fondo(svg), brillo)
    out.paste(arte, (0, 0), mascara)
    return out.resize((N, N), Image.LANCZOS)


def logo_transparente(svg, arte, mascara):
    """Logo con fondo transparente (splash y encabezado): así no se ve un recuadro alrededor."""
    gm = mascara.filter(ImageFilter.GaussianBlur(svg.desenfoque * SS)).point(lambda v: int(v * BRILLO_LOGO))
    base = Image.new('RGBA', arte.size, (255, 110, 40, 0))
    base.putalpha(gm)
    capa = arte.convert('RGBA')
    capa.putalpha(mascara)
    return Image.alpha_composite(base, capa).resize((N, N), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser(description='Genera los íconos de Dankai desde img/dankai-logo.svg')
    ap.add_argument('--salida', default=RAIZ, help='carpeta de salida (por defecto, la raíz del repositorio)')
    ruta = ap.parse_args().salida
    svg = Svg(os.path.join(RAIZ, 'img', 'dankai-logo.svg'))
    arte, mascara = simbolo(svg)
    ico, logo = icono(svg, arte, mascara), logo_transparente(svg, arte, mascara)
    for sub in ('icons', 'img'):
        os.makedirs(os.path.join(ruta, sub), exist_ok=True)
    for lado, nombre in ((512, 'icon-512.png'), (192, 'icon-192.png'), (512, 'maskable-512.png'), (180, 'apple-touch-icon.png')):
        ico.resize((lado, lado), Image.LANCZOS).save(os.path.join(ruta, 'icons', nombre), optimize=True)
    logo.resize((512, 512), Image.LANCZOS).save(os.path.join(ruta, 'img', 'logo.webp'), 'WEBP', quality=88, method=6)
    print('Listo:', ruta)


if __name__ == '__main__':
    main()
