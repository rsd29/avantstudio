type GL = WebGL2RenderingContext;

type FBO = {
  w: number;
  h: number;
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  texel: Float32Array;
};

type DoubleFBO = {
  w: number;
  h: number;
  texel: Float32Array;
  read: FBO;
  write: FBO;
  swap: () => void;
};

function compile(gl: GL, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log || "Shader compile failed");
  }
  return shader;
}

function createProgram(gl: GL, vs: string, fs: string) {
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  const vertex = compile(gl, gl.VERTEX_SHADER, vs);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fs);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(log || "Program link failed");
  }
  return program;
}

function bindProgram(gl: GL, program: WebGLProgram) {
  gl.useProgram(program);
  const loc = gl.getAttribLocation(program, "aPos");
  if (loc >= 0) {
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }
}

function createFBO(
  gl: GL,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number,
): FBO {
  const texture = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!texture || !fbo) throw new Error("Failed to create framebuffer");

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );

  return {
    w,
    h,
    texture,
    fbo,
    texel: new Float32Array([1 / w, 1 / h]),
  };
}

function createDoubleFBO(
  gl: GL,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number,
): DoubleFBO {
  let read = createFBO(gl, w, h, internalFormat, format, type, filter);
  let write = createFBO(gl, w, h, internalFormat, format, type, filter);
  return {
    w,
    h,
    texel: read.texel,
    read,
    write,
    swap() {
      const tmp = read;
      read = write;
      write = tmp;
      this.read = read;
      this.write = write;
    },
  };
}

function deleteFBO(gl: GL, target: FBO) {
  gl.deleteFramebuffer(target.fbo);
  gl.deleteTexture(target.texture);
}

function deleteDoubleFBO(gl: GL, target: DoubleFBO) {
  deleteFBO(gl, target.read);
  deleteFBO(gl, target.write);
}

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const SPLAT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec3 uColor;
uniform float uRadius;
uniform float uAspect;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  float splat = exp(-dot(p, p) / uRadius);
  vec3 base = texture(uTarget, vUv).xyz;
  fragColor = vec4(base + splat * uColor, 1.0);
}`;

const ADVECT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 vel = texture(uVelocity, vUv).xy;
  vec2 coord = vUv - uDt * vel * uTexel * 150.0;
  fragColor = uDissipation * texture(uSource, coord);
}`;

const DIVERGENCE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float L = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float T = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vUv.x < uTexel.x) L = -C.x;
  if (vUv.x > 1.0 - uTexel.x) R = -C.x;
  if (vUv.y < uTexel.y) B = -C.y;
  if (vUv.y > 1.0 - uTexel.y) T = -C.y;
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const CLEAR = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform float uValue;
void main() {
  fragColor = uValue * texture(uTexture, vUv);
}`;

const PRESSURE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
void main() {
  float L = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float C = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + B + T - C) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float L = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  vec2 vel = texture(uVelocity, vUv).xy;
  vel.xy -= vec2(R - L, T - B);
  fragColor = vec4(vel, 0.0, 1.0);
}`;

const CURL = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float L = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float R = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float B = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  fragColor = vec4(0.5 * (R - L - (T - B)), 0.0, 0.0, 1.0);
}`;

const VORTICITY = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uCurlForce;
uniform float uDt;
void main() {
  float L = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uCurlForce * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy;
  vel += force * uDt;
  vel = clamp(vel, -1000.0, 1000.0);
  fragColor = vec4(vel, 0.0, 1.0);
}`;

const DISPLAY = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uDye;
uniform float uThreshold;
uniform float uBreakup;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
  float d = texture(uDye, vUv).r;
  float n = hash(gl_FragCoord.xy);
  float a = step(uThreshold + n * uBreakup, d);
  fragColor = vec4(vec3(a), a);
}`;

function resolution(gl: GL, n: number) {
  const aspect = gl.drawingBufferWidth / Math.max(gl.drawingBufferHeight, 1);
  let w: number;
  let h: number;
  if (aspect > 1) {
    w = Math.round(n * aspect);
    h = n;
  } else {
    w = n;
    h = Math.round(n / Math.max(aspect, 0.0001));
  }
  return [Math.max(w, 32), Math.max(h, 32)] as const;
}

export class FluidSim {
  private gl: GL;
  private programs: Record<string, WebGLProgram>;
  private uniforms: Record<string, Record<string, WebGLUniformLocation | null>>;
  private velocity!: DoubleFBO;
  private dye!: DoubleFBO;
  private pressure!: DoubleFBO;
  private divergence!: FBO;
  private curl!: FBO;
  private formats: {
    internalFormat: number;
    format: number;
    type: number;
  };
  private destroyed = false;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error("WebGL2 not available");
    this.gl = gl;

    const ext = gl.getExtension("EXT_color_buffer_float");
    const linear = gl.getExtension("OES_texture_float_linear");
    if (!ext) throw new Error("Float color buffers not available");

    this.formats = {
      internalFormat: gl.RGBA16F,
      format: gl.RGBA,
      type: gl.HALF_FLOAT,
    };

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    this.programs = {
      splat: createProgram(gl, VERT, SPLAT),
      advect: createProgram(gl, VERT, ADVECT),
      divergence: createProgram(gl, VERT, DIVERGENCE),
      clear: createProgram(gl, VERT, CLEAR),
      pressure: createProgram(gl, VERT, PRESSURE),
      gradient: createProgram(gl, VERT, GRADIENT),
      curl: createProgram(gl, VERT, CURL),
      vorticity: createProgram(gl, VERT, VORTICITY),
      display: createProgram(gl, VERT, DISPLAY),
    };

    this.uniforms = {};
    for (const [name, program] of Object.entries(this.programs)) {
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      this.uniforms[name] = {};
      for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(program, i);
        if (!info) continue;
        this.uniforms[name][info.name] = gl.getUniformLocation(
          program,
          info.name,
        );
      }
    }

    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    this.initFramebuffers();
    void linear;
  }

  private initFramebuffers() {
    const gl = this.gl;
    const { internalFormat, format, type } = this.formats;
    const [simW, simH] = resolution(gl, 160);
    const [dyeW, dyeH] = resolution(gl, 320);

    if (this.velocity) deleteDoubleFBO(gl, this.velocity);
    if (this.dye) deleteDoubleFBO(gl, this.dye);
    if (this.pressure) deleteDoubleFBO(gl, this.pressure);
    if (this.divergence) deleteFBO(gl, this.divergence);
    if (this.curl) deleteFBO(gl, this.curl);

    this.velocity = createDoubleFBO(
      gl,
      simW,
      simH,
      internalFormat,
      format,
      type,
      gl.LINEAR,
    );
    this.pressure = createDoubleFBO(
      gl,
      simW,
      simH,
      internalFormat,
      format,
      type,
      gl.NEAREST,
    );
    this.divergence = createFBO(
      gl,
      simW,
      simH,
      internalFormat,
      format,
      type,
      gl.NEAREST,
    );
    this.curl = createFBO(
      gl,
      simW,
      simH,
      internalFormat,
      format,
      type,
      gl.NEAREST,
    );
    this.dye = createDoubleFBO(
      gl,
      dyeW,
      dyeH,
      internalFormat,
      format,
      type,
      gl.LINEAR,
    );
  }

  resize(width: number, height: number) {
    const gl = this.gl;
    if (gl.canvas.width === width && gl.canvas.height === height) return;
    gl.canvas.width = width;
    gl.canvas.height = height;
    this.initFramebuffers();
  }

  splat(x: number, y: number, dx: number, dy: number, amount = 1) {
    const gl = this.gl;
    const aspect = gl.canvas.width / Math.max(gl.canvas.height, 1);
    this.blitSplat(this.velocity, x, y, dx * 0.55, dy * 0.55, 0, 0.00055, aspect);
    const dye = 1.8 * amount;
    this.blitSplat(this.dye, x, y, dye, dye, dye, 0.00048, aspect);
  }

  private blitSplat(
    target: DoubleFBO,
    x: number,
    y: number,
    r: number,
    g: number,
    b: number,
    radius: number,
    aspect: number,
  ) {
    const gl = this.gl;
    const p = this.programs.splat;
    const u = this.uniforms.splat;
    bindProgram(gl, p);
    gl.viewport(0, 0, target.w, target.h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.write.fbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target.read.texture);
    gl.uniform1i(u.uTarget, 0);
    gl.uniform2f(u.uPoint, x, y);
    gl.uniform3f(u.uColor, r, g, b);
    gl.uniform1f(u.uRadius, radius);
    gl.uniform1f(u.uAspect, aspect);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    target.swap();
  }

  step(
    dt: number,
    opts: {
      dyeDissipation?: number;
      threshold?: number;
      breakup?: number;
    } = {},
  ) {
    const gl = this.gl;
    dt = Math.min(dt, 0.033) * 0.72;
    const v = this.velocity;
    const texel = v.texel;
    const dyeDissipation = opts.dyeDissipation ?? 0.96;
    const threshold = opts.threshold ?? 0.14;
    const breakup = opts.breakup ?? 0.05;

    bindProgram(gl, this.programs.curl);
    gl.viewport(0, 0, v.w, v.h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.curl.fbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, v.read.texture);
    gl.uniform1i(this.uniforms.curl.uVelocity, 0);
    gl.uniform2fv(this.uniforms.curl.uTexel, texel);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    bindProgram(gl, this.programs.vorticity);
    gl.bindFramebuffer(gl.FRAMEBUFFER, v.write.fbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, v.read.texture);
    gl.uniform1i(this.uniforms.vorticity.uVelocity, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.curl.texture);
    gl.uniform1i(this.uniforms.vorticity.uCurl, 1);
    gl.uniform2fv(this.uniforms.vorticity.uTexel, texel);
    gl.uniform1f(this.uniforms.vorticity.uCurlForce, 16);
    gl.uniform1f(this.uniforms.vorticity.uDt, dt);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    v.swap();

    bindProgram(gl, this.programs.divergence);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.divergence.fbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, v.read.texture);
    gl.uniform1i(this.uniforms.divergence.uVelocity, 0);
    gl.uniform2fv(this.uniforms.divergence.uTexel, texel);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    bindProgram(gl, this.programs.clear);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pressure.write.fbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pressure.read.texture);
    gl.uniform1i(this.uniforms.clear.uTexture, 0);
    gl.uniform1f(this.uniforms.clear.uValue, 0.8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.pressure.swap();

    bindProgram(gl, this.programs.pressure);
    gl.uniform2fv(this.uniforms.pressure.uTexel, texel);
    gl.uniform1i(this.uniforms.pressure.uPressure, 0);
    gl.uniform1i(this.uniforms.pressure.uDivergence, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.divergence.texture);
    for (let i = 0; i < 16; i++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.pressure.write.fbo);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.pressure.read.texture);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      this.pressure.swap();
    }

    bindProgram(gl, this.programs.gradient);
    gl.bindFramebuffer(gl.FRAMEBUFFER, v.write.fbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pressure.read.texture);
    gl.uniform1i(this.uniforms.gradient.uPressure, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, v.read.texture);
    gl.uniform1i(this.uniforms.gradient.uVelocity, 1);
    gl.uniform2fv(this.uniforms.gradient.uTexel, texel);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    v.swap();

    bindProgram(gl, this.programs.advect);
    gl.uniform1i(this.uniforms.advect.uVelocity, 0);
    gl.uniform1i(this.uniforms.advect.uSource, 1);
    gl.uniform2fv(this.uniforms.advect.uTexel, texel);
    gl.uniform1f(this.uniforms.advect.uDt, dt);
    gl.viewport(0, 0, v.w, v.h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, v.write.fbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, v.read.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, v.read.texture);
    gl.uniform1f(this.uniforms.advect.uDissipation, 0.96);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    v.swap();

    gl.viewport(0, 0, this.dye.w, this.dye.h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.dye.write.fbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, v.read.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.dye.read.texture);
    gl.uniform2fv(this.uniforms.advect.uTexel, texel);
    gl.uniform1f(this.uniforms.advect.uDissipation, dyeDissipation);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.dye.swap();

    bindProgram(gl, this.programs.display);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.dye.read.texture);
    gl.uniform1i(this.uniforms.display.uDye, 0);
    gl.uniform1f(this.uniforms.display.uThreshold, threshold);
    gl.uniform1f(this.uniforms.display.uBreakup, breakup);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    const gl = this.gl;
    deleteDoubleFBO(gl, this.velocity);
    deleteDoubleFBO(gl, this.dye);
    deleteDoubleFBO(gl, this.pressure);
    deleteFBO(gl, this.divergence);
    deleteFBO(gl, this.curl);
    for (const program of Object.values(this.programs)) {
      gl.deleteProgram(program);
    }
    const lose = gl.getExtension("WEBGL_lose_context");
    lose?.loseContext();
  }
}
