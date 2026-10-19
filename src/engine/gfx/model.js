import { TEXELS_PER_UNIT } from '../config.js';

/**
 * A model definition (defs.js defineModel) made ready for the renderer: flat
 * vertex arrays, colours as palette indices, texture slots, texture
 * coordinates in repeats, and a unit normal per face. A face in a grime
 * texture (`grime`) darkens what's behind it instead of covering it.
 */
export class Model {
  /**
   * @param {any} def
   * @param {import('./palette.js').Palette} palette
   * @param {(id:string) => number} textureSlot
   * @param {{w:number, h:number}[]} [textures] by slot, to turn world-unit `uvw` into repeats
   */
  constructor(def, palette, textureSlot, textures = []) {
    this.id = def.id;
    const n = def.vertices.length;
    this.verts = new Float32Array(n * 3);
    let radius = 0;
    let zMin = Infinity;
    let zMax = -Infinity;
    def.vertices.forEach(([x, y, z], i) => {
      this.verts.set([x, y, z], i * 3);
      radius = Math.max(radius, Math.hypot(x, y));
      zMin = Math.min(zMin, z);
      zMax = Math.max(zMax, z);
    });
    /** Horizontal reach from the origin, and the height range (model units). */
    this.radius = radius;
    this.zMin = zMin;
    this.zMax = zMax;
    this.faces = def.faces.map((f) => {
      const [nx, ny, nz] = newell(def.vertices, f.v);
      const slot = f.tex ? textureSlot(f.tex) : -1;
      let uv = null;
      if (f.uv) uv = Float32Array.from(f.uv.flat());
      else if (f.uvw) {
        const tex = textures[slot] ?? { w: 64, h: 64 };
        uv = Float32Array.from(f.uvw.flatMap(([u, v]) => [(u * TEXELS_PER_UNIT) / tex.w, (v * TEXELS_PER_UNIT) / tex.h]));
      }
      return {
        v: Int32Array.from(f.v),
        color: f.tex ? -1 : colorIndex(palette, f.color, !!f.glow),
        slot,
        uv: f.tex ? uv : null,
        glow: !!f.glow,
        twoSided: !!f.twoSided,
        flat: !!f.flat,
        grime: !!textures[slot]?.shade,
        nx,
        ny,
        nz,
      };
    });
    this.lines = (def.lines ?? []).map((l) => Float32Array.from(l));
  }
}

/** A face colour: [ramp name, 0..1] or [r, g, b]. Glowing colours may use the fullbright entries. */
export function colorIndex(palette, color, glow = false) {
  if (typeof color?.[0] === 'string') return palette.ramp(color[0], color[1] ?? 0.5);
  const [r, g, b] = color;
  return palette.lookup(r | 0, g | 0, b | 0, !glow);
}

/** Unit normal of a polygon by Newell's method (robust for slightly non-planar quads). */
function newell(vertices, idx) {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let i = 0; i < idx.length; i++) {
    const [x0, y0, z0] = vertices[idx[i]];
    const [x1, y1, z1] = vertices[idx[(i + 1) % idx.length]];
    nx += (y0 - y1) * (z0 + z1);
    ny += (z0 - z1) * (x0 + x1);
    nz += (x0 - x1) * (y0 + y1);
  }
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}
