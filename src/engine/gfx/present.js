import { SCREEN_W, SCREEN_H, PIXEL_ASPECT, screenWidth } from '../config.js';

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_src;
uniform float u_rows;
uniform vec2 u_out;
uniform float u_time;
uniform float u_curve;
uniform float u_scan;
uniform float u_mask;
uniform float u_vig;
uniform float u_noise;
uniform float u_glow;

vec2 warp(vec2 uv) {
  vec2 c = uv * 2.0 - 1.0;
  c *= 1.0 + u_curve * dot(c, c);
  return c * 0.5 + 0.5;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 fetch(vec2 uv) {
  vec2 t = (floor(uv * u_src) + 0.5) / u_src;
  return texture2D(u_tex, t).rgb;
}

void main() {
  vec2 uv = warp(v_uv);
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec3 col = fetch(uv);
  if (u_glow > 0.0) {
    vec2 px = 1.0 / u_src;
    vec3 b = fetch(uv + vec2(px.x, 0.0)) + fetch(uv - vec2(px.x, 0.0)) +
             fetch(uv + vec2(0.0, px.y)) + fetch(uv - vec2(0.0, px.y));
    col = mix(col, max(col, b * 0.25), u_glow * 0.6);
  }
  float row = fract(uv.y * u_rows);
  col *= 1.0 - u_scan * pow(abs(row - 0.5) * 2.0, 2.0);
  float m = mod(floor(gl_FragCoord.x), 3.0);
  vec3 mask = vec3(1.0 - u_mask);
  if (m < 0.5) mask.r = 1.0; else if (m < 1.5) mask.g = 1.0; else mask.b = 1.0;
  col *= mask;
  col *= 1.0 + u_scan * 0.35 + u_mask * 0.6;
  vec2 d = uv - 0.5;
  col *= 1.0 - u_vig * dot(d, d) * 2.5;
  col += (hash(floor(gl_FragCoord.xy) + fract(u_time) * 97.0) - 0.5) * u_noise;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

/** CRT strength presets. */
export const CRT_MODES = {
  off: { curve: 0, scan: 0, mask: 0, vig: 0, noise: 0, glow: 0 },
  subtle: { curve: 0, scan: 0.22, mask: 0.06, vig: 0.18, noise: 0.025, glow: 0.3 },
  full: { curve: 0.06, scan: 0.42, mask: 0.16, vig: 0.32, noise: 0.045, glow: 0.55 },
};

/**
 * Turns the 8-bit framebuffer into pixels on screen: palette lookup, then
 * either a WebGL CRT pass or a plain nearest-neighbour 2D canvas.
 *
 * It also picks the framebuffer width. With `wide` on, the width follows the
 * window (see screenWidth), so a 16:9 window gets a 426-column frame instead
 * of black bars. The game reads `w` each frame and resizes to match.
 */
export class Presenter {
  constructor(canvas, { height = SCREEN_H, preferGL = true, wide = true, scale = 1 } = {}) {
    this.canvas = canvas;
    this.w = SCREEN_W;
    this.h = height;
    /** Framebuffer pixels per layout pixel; the framebuffer is pw x ph. */
    this.scale = scale;
    this.wide = wide;
    this.mode = 'subtle';
    this.gl = null;
    this.rgba = new Uint32Array(this.pw * this.ph);
    this.bytes = new Uint8Array(this.rgba.buffer);
    if (preferGL) {
      try {
        this._initGL();
      } catch (err) {
        console.warn('WebGL unavailable, using 2D canvas.', err);
        this.gl = null;
      }
    }
    if (!this.gl) this._init2D();
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    window.visualViewport?.addEventListener('resize', this._onResize);
    this.resize();
  }

  get pw() {
    return Math.round(this.w * this.scale);
  }

  get ph() {
    return Math.round(this.h * this.scale);
  }

  get backend() {
    return this.gl ? 'webgl' : '2d';
  }

  setMode(mode) {
    this.mode = CRT_MODES[mode] ? mode : 'off';
  }

  /** Widescreen on or off; off keeps the 320-column 4:3 frame. */
  setWide(wide) {
    if (this.wide === !!wide) return;
    this.wide = !!wide;
    this.resize();
  }

  /** Display aspect of the current framebuffer (4:3 at 320 columns). */
  get aspect() {
    return this.w / (this.h * PIXEL_ASPECT);
  }

  /** Reallocate the pixel buffers and texture for a new framebuffer width. */
  _setWidth(w) {
    if (w === this.w) return;
    this.w = w;
    if (this.gl) {
      const gl = this.gl;
      this.rgba = new Uint32Array(this.pw * this.ph);
      this.bytes = new Uint8Array(this.rgba.buffer);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.pw, this.ph, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.bytes);
      gl.uniform2f(this.uniforms.src, this.pw, this.ph);
    } else {
      this._init2D();
    }
  }

  _init2D() {
    this.canvas.width = this.pw;
    this.canvas.height = this.ph;
    this.ctx = this.canvas.getContext('2d');
    this.imageData = this.ctx.createImageData(this.pw, this.ph);
    this.rgba = new Uint32Array(this.imageData.data.buffer);
    this.bytes = new Uint8Array(this.rgba.buffer);
  }

  _initGL() {
    const gl = this.canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
    if (!gl) throw new Error('no webgl context');
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader error');
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link error');
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.pw, this.ph, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.bytes);

    const u = (name) => gl.getUniformLocation(prog, name);
    this.uniforms = {
      src: u('u_src'),
      out: u('u_out'),
      time: u('u_time'),
      curve: u('u_curve'),
      scan: u('u_scan'),
      mask: u('u_mask'),
      vig: u('u_vig'),
      noise: u('u_noise'),
      glow: u('u_glow'),
      rows: u('u_rows'),
    };
    gl.uniform1i(u('u_tex'), 0);
    gl.uniform2f(this.uniforms.src, this.pw, this.ph);
    this.gl = gl;
  }

  /** Pick the framebuffer width for the window, then fit the canvas to the largest box of that aspect. */
  resize() {
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    this._setWidth(this.wide ? screenWidth(vw / Math.max(1, vh)) : SCREEN_W);
    let cw = vw;
    let ch = vw / this.aspect;
    if (ch > vh) {
      ch = vh;
      cw = vh * this.aspect;
    }
    cw = Math.max(1, Math.floor(cw));
    ch = Math.max(1, Math.floor(ch));
    this.canvas.style.width = `${cw}px`;
    this.canvas.style.height = `${ch}px`;
    if (this.gl) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(cw * dpr);
      this.canvas.height = Math.round(ch * dpr);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /** Map a client (CSS pixel) position to framebuffer coordinates. */
  toScreen(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * this.w,
      y: ((clientY - r.top) / r.height) * this.h,
    };
  }

  /**
   * @param {Uint8Array} px 8-bit framebuffer
   * @param {Uint32Array} pal32 palette as RGBA words
   * @param {number} time seconds, animates film grain
   */
  present(px, pal32, time = 0) {
    const rgba = this.rgba;
    const n = this.pw * this.ph;
    for (let i = 0; i < n; i++) rgba[i] = pal32[px[i]];

    const gl = this.gl;
    if (!gl) {
      this.ctx.putImageData(this.imageData, 0, 0);
      return;
    }
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.pw, this.ph, gl.RGBA, gl.UNSIGNED_BYTE, this.bytes);
    const m = CRT_MODES[this.mode] ?? CRT_MODES.off;
    // Scanlines are a layout row apart (200 down the screen at 2x too), and need a
    // few physical pixels per row; soften them on small screens.
    const rowsPx = this.canvas.height / this.h;
    const scanScale = Math.max(0, Math.min(1, (rowsPx - 1.5) / 1.5));
    const U = this.uniforms;
    gl.uniform2f(U.out, this.canvas.width, this.canvas.height);
    gl.uniform1f(U.rows, this.h);
    gl.uniform1f(U.time, time);
    gl.uniform1f(U.curve, m.curve);
    gl.uniform1f(U.scan, m.scan * scanScale);
    gl.uniform1f(U.mask, rowsPx >= 3 ? m.mask : 0);
    gl.uniform1f(U.vig, m.vig);
    gl.uniform1f(U.noise, m.noise);
    gl.uniform1f(U.glow, m.glow);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
