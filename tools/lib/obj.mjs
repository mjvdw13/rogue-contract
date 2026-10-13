// Reads Wavefront OBJ (+ MTL) text into the game's model format (see
// defineModel in src/engine/defs.js). Used by tools/import-model.mjs.
//
// Blender exports OBJ with Y up and -Z forward. The game's axes are x east,
// y south, z up, with a model facing +x at angle 0, so a model's front (the
// side Blender's front view shows, facing -Y) becomes +x and Blender's +X
// becomes -y. That mapping mirrors, so faces are re-wound to keep their
// normals pointing out.

/** Materials from MTL text: name -> { color: [r, g, b] (0-255), map: file name or null }. */
export function parseMTL(text) {
  const out = {};
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const [key, ...rest] = raw.trim().split(/\s+/);
    if (key === 'newmtl') out[(cur = rest.join(' '))] = { color: [200, 200, 200], map: null };
    else if (!cur) continue;
    else if (key === 'Kd') out[cur].color = rest.slice(0, 3).map((c) => Math.round(Math.min(1, Math.max(0, +c)) * 255));
    else if (key === 'map_Kd') out[cur].map = rest[rest.length - 1].split(/[\\/]/).pop();
  }
  return out;
}

/**
 * Model data from OBJ text.
 * @param {string} text
 * @param {{materials?:Record<string, {color:number[], map:string|null}>, scale?:number,
 *   texture?:(file:string) => string|null, glow?:(material:string) => boolean}} [opts]
 *   `texture` turns an MTL texture file into a game texture id (null: use the colour).
 * @returns {{vertices:number[][], faces:any[], warnings:string[]}}
 */
export function parseOBJ(text, { materials = {}, scale = 1, texture = () => null, glow = () => false } = {}) {
  const pos = [];
  const tex = [];
  const vertices = [];
  const index = new Map();
  const faces = [];
  const warnings = new Set();
  let material = null;
  const round = (v) => Math.round(v * 1e5) / 1e5;
  const vertex = (i) => {
    let k = index.get(i);
    if (k === undefined) {
      const [ox, oy, oz] = pos[i];
      k = vertices.length;
      vertices.push([round(oz * scale), round(-ox * scale), round(oy * scale)]);
      index.set(i, k);
    }
    return k;
  };
  for (const raw of text.split(/\r?\n/)) {
    const [key, ...rest] = raw.trim().split(/\s+/);
    if (key === 'v') pos.push(rest.slice(0, 3).map(Number));
    else if (key === 'vt') tex.push([+rest[0], 1 - +(rest[1] ?? 0)]);
    else if (key === 'usemtl') material = rest.join(' ');
    else if (key === 'f') {
      const corners = rest.map((c) => {
        const [v, t] = c.split('/');
        const vi = +v < 0 ? pos.length + +v : +v - 1;
        const ti = t ? (+t < 0 ? tex.length + +t : +t - 1) : -1;
        return { v: vertex(vi), t: ti };
      });
      corners.reverse(); // the axis mapping mirrors
      const mat = materials[material] ?? null;
      if (material && !mat) warnings.add(`no material "${material}" in the MTL; using grey`);
      const texId = mat?.map ? texture(mat.map) : null;
      if (mat?.map && !texId) warnings.add(`texture "${mat.map}" is not a game texture; using the material's colour`);
      // Split into a fan of triangles: OBJ polygons may be bent or concave,
      // and the renderer fills flat convex ones.
      for (let i = 1; i + 1 < corners.length; i++) {
        const tri = [corners[0], corners[i], corners[i + 1]];
        const face = { v: tri.map((c) => c.v) };
        if (texId && tri.every((c) => c.t >= 0)) {
          face.tex = texId;
          face.uv = tri.map((c) => tex[c.t].map(round));
        } else face.color = mat?.color ?? [200, 200, 200];
        if (material && glow(material)) face.glow = true;
        faces.push(face);
      }
      if (corners.length > 4) warnings.add('polygons with more than 4 corners were split as fans; triangulate concave ones on export');
    }
  }
  return { vertices, faces, warnings: [...warnings] };
}
