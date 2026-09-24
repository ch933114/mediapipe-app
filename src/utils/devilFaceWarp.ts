// Face-pixel warp into a devil / 把臉部像素扭曲成惡魔

export type NormalizedLandmark = {
  x: number;
  y: number;
};

export type DevilFaceWarpFrame = {
  video: HTMLVideoElement;
  landmarks: NormalizedLandmark[] | null;
  morph: number;
  timeMs: number;
};

export type DevilFaceWarp = {
  resize: (viewWidth: number, viewHeight: number) => void;
  render: (frame: DevilFaceWarpFrame) => void;
  clear: () => void;
  destroy: () => void;
};

type Point = { x: number; y: number };
type CoverTransform = {
  offsetX: number;
  offsetY: number;
  drawWidth: number;
  drawHeight: number;
};
type WarpControl = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
};
type FaceOffset = {
  index: number;
  ox: number;
  oy: number;
  radius: number;
  pulse: boolean;
};

const GRID_COLUMNS = 36;
const GRID_ROWS = 48;
const VERTEX_COUNT = (GRID_COLUMNS + 1) * (GRID_ROWS + 1);
const INDEX_COUNT = GRID_COLUMNS * GRID_ROWS * 6;

const FACE_OFFSETS: readonly FaceOffset[] = [
  { index: 103, ox: -0.1, oy: -0.22, radius: 0.36, pulse: true },
  { index: 67, ox: -0.04, oy: -0.1, radius: 0.28, pulse: true },
  { index: 54, ox: -0.08, oy: -0.06, radius: 0.26, pulse: true },
  { index: 332, ox: 0.1, oy: -0.22, radius: 0.36, pulse: true },
  { index: 297, ox: 0.04, oy: -0.1, radius: 0.28, pulse: true },
  { index: 284, ox: 0.08, oy: -0.06, radius: 0.26, pulse: true },
  { index: 10, ox: 0, oy: 0.045, radius: 0.2, pulse: false },
  { index: 70, ox: 0.03, oy: 0.06, radius: 0.16, pulse: false },
  { index: 105, ox: -0.035, oy: -0.02, radius: 0.14, pulse: false },
  { index: 300, ox: -0.03, oy: 0.06, radius: 0.16, pulse: false },
  { index: 334, ox: 0.035, oy: -0.02, radius: 0.14, pulse: false },
  { index: 33, ox: -0.05, oy: -0.04, radius: 0.14, pulse: false },
  { index: 133, ox: 0.02, oy: 0.03, radius: 0.12, pulse: false },
  { index: 159, ox: 0, oy: 0.028, radius: 0.1, pulse: false },
  { index: 145, ox: 0, oy: -0.02, radius: 0.1, pulse: false },
  { index: 263, ox: 0.05, oy: -0.04, radius: 0.14, pulse: false },
  { index: 362, ox: -0.02, oy: 0.03, radius: 0.12, pulse: false },
  { index: 386, ox: 0, oy: 0.028, radius: 0.1, pulse: false },
  { index: 374, ox: 0, oy: -0.02, radius: 0.1, pulse: false },
  { index: 1, ox: 0, oy: 0.08, radius: 0.16, pulse: false },
  { index: 98, ox: -0.025, oy: 0.02, radius: 0.11, pulse: false },
  { index: 327, ox: 0.025, oy: 0.02, radius: 0.11, pulse: false },
  { index: 61, ox: -0.11, oy: -0.04, radius: 0.2, pulse: false },
  { index: 291, ox: 0.11, oy: -0.04, radius: 0.2, pulse: false },
  { index: 13, ox: 0, oy: -0.02, radius: 0.12, pulse: false },
  { index: 14, ox: 0, oy: 0.055, radius: 0.13, pulse: false },
  { index: 84, ox: -0.02, oy: 0.1, radius: 0.16, pulse: false },
  { index: 314, ox: 0.02, oy: 0.1, radius: 0.16, pulse: false },
  { index: 152, ox: 0, oy: 0.15, radius: 0.28, pulse: false },
  { index: 148, ox: 0.045, oy: 0.06, radius: 0.16, pulse: false },
  { index: 377, ox: -0.045, oy: 0.06, radius: 0.16, pulse: false },
  { index: 172, ox: 0.04, oy: 0.02, radius: 0.16, pulse: false },
  { index: 397, ox: -0.04, oy: 0.02, radius: 0.16, pulse: false },
  { index: 234, ox: 0.035, oy: 0, radius: 0.18, pulse: false },
  { index: 454, ox: -0.035, oy: 0, radius: 0.18, pulse: false },
  { index: 116, ox: 0.04, oy: 0.015, radius: 0.16, pulse: false },
  { index: 345, ox: -0.04, oy: 0.015, radius: 0.16, pulse: false },
];

const VERTEX_SHADER = `
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vTexCoord = aTexCoord;
}
`;

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uFaceCenter;
uniform vec2 uAxisX;
uniform vec2 uAxisY;
uniform float uFaceWidth;
uniform float uMorph;
uniform vec2 uEyeLeft;
uniform vec2 uEyeRight;
uniform float uEyeRadius;

void main() {
  vec4 color = texture2D(uTexture, vTexCoord);
  if (uMorph < 0.001 || uFaceWidth < 1.0) {
    gl_FragColor = color;
    return;
  }

  vec2 pixel = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 rel = pixel - uFaceCenter;
  float lx = dot(rel, uAxisX) / uFaceWidth;
  float ly = dot(rel, uAxisY) / uFaceWidth;
  float ellipse = (lx * lx) / 0.4 + (ly * ly) / 0.78;
  float mask = smoothstep(1.28, 0.58, ellipse) * uMorph;
  vec3 devilSkin = vec3(
    min(color.r * 1.32 + 0.1, 1.0),
    color.g * 0.34,
    color.b * 0.28
  );
  vec3 mixed = mix(color.rgb, devilSkin, mask * 0.88);
  float eyeMask = 0.0;
  if (uEyeRadius > 1.0) {
    float eye = min(distance(pixel, uEyeLeft), distance(pixel, uEyeRight));
    eyeMask = smoothstep(uEyeRadius, uEyeRadius * 0.22, eye) * uMorph;
  }
  mixed = mix(mixed, mixed * vec3(0.32, 0.07, 0.06), eyeMask * 0.82);
  float horn = smoothstep(0.05, -0.38, ly) * smoothstep(0.06, 0.28, abs(lx));
  horn *= smoothstep(0.62, 0.24, abs(lx));
  mixed = mix(
    mixed,
    mixed * vec3(0.4, 0.05, 0.05) + vec3(0.18, 0.0, 0.0),
    horn * mask
  );
  gl_FragColor = vec4(mixed, 1.0);
}
`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCoverTransform(
  sourceWidth: number,
  sourceHeight: number,
  viewWidth: number,
  viewHeight: number
): CoverTransform | null {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    viewWidth <= 0 ||
    viewHeight <= 0
  )
    return null;

  const sourceAspect = sourceWidth / sourceHeight;
  const viewAspect = viewWidth / viewHeight;
  if (sourceAspect > viewAspect) {
    const drawHeight = viewHeight;
    const drawWidth = viewHeight * sourceAspect;
    return {
      offsetX: (viewWidth - drawWidth) / 2,
      offsetY: 0,
      drawWidth,
      drawHeight,
    };
  }

  const drawWidth = viewWidth;
  const drawHeight = viewWidth / sourceAspect;
  return {
    offsetX: 0,
    offsetY: (viewHeight - drawHeight) / 2,
    drawWidth,
    drawHeight,
  };
}

function smoothFalloff(distance: number, radius: number) {
  if (distance >= radius) return 0;
  const t = 1 - distance / radius;
  return t * t * (3 - 2 * t);
}

function displace(point: Point, controls: WarpControl[], morph: number): Point {
  let dx = 0;
  let dy = 0;
  for (const control of controls) {
    const distance = Math.hypot(point.x - control.x, point.y - control.y);
    const weight = smoothFalloff(distance, control.radius);
    if (weight <= 0) continue;
    dx += control.dx * weight;
    dy += control.dy * weight;
  }

  return {
    x: point.x + dx * morph,
    y: point.y + dy * morph,
  };
}

function createIndices() {
  const indices = new Uint16Array(INDEX_COUNT);
  let offset = 0;
  const stride = GRID_COLUMNS + 1;
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let column = 0; column < GRID_COLUMNS; column += 1) {
      const index = row * stride + column;
      const below = index + stride;
      indices[offset] = index;
      indices[offset + 1] = below;
      indices[offset + 2] = index + 1;
      indices[offset + 3] = index + 1;
      indices[offset + 4] = below;
      indices[offset + 5] = below + 1;
      offset += 6;
    }
  }
  return indices;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function createWarpProgram(gl: WebGLRenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.bindAttribLocation(program, 1, "aTexCoord");
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

function buildControls(
  landmarks: NormalizedLandmark[],
  cover: CoverTransform,
  morph: number,
  timeMs: number
) {
  const toCanvas = (index: number): Point | null => {
    const landmark = landmarks[index];
    if (!landmark) return null;
    return {
      x: cover.offsetX + landmark.x * cover.drawWidth,
      y: cover.offsetY + landmark.y * cover.drawHeight,
    };
  };
  const faceLeft = toCanvas(234);
  const faceRight = toCanvas(454);
  const forehead = toCanvas(10);
  const chin = toCanvas(152);
  if (!faceLeft || !faceRight || !forehead || !chin) return null;

  const faceWidth = Math.hypot(
    faceRight.x - faceLeft.x,
    faceRight.y - faceLeft.y
  );
  const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);
  if (faceWidth < 12 || faceHeight < 12) return null;

  const axisX = {
    x: (faceRight.x - faceLeft.x) / faceWidth,
    y: (faceRight.y - faceLeft.y) / faceWidth,
  };
  const axisY = {
    x: (chin.x - forehead.x) / faceHeight,
    y: (chin.y - forehead.y) / faceHeight,
  };
  const pulse = 1 + Math.sin(timeMs / 220) * 0.08 * clamp(morph, 0, 1);
  const controls: WarpControl[] = [];

  const toDelta = (ox: number, oy: number) => ({
    x: (axisX.x * ox + axisY.x * oy) * faceWidth,
    y: (axisX.y * ox + axisY.y * oy) * faceWidth,
  });

  for (const offset of FACE_OFFSETS) {
    const source = toCanvas(offset.index);
    if (!source) continue;
    const delta = toDelta(offset.ox, offset.oy);
    const scale = offset.pulse ? pulse : 1;
    controls.push({
      x: source.x,
      y: source.y,
      dx: delta.x * scale,
      dy: delta.y * scale,
      radius: offset.radius * faceWidth,
    });
  }

  const pushHornTip = (index: number, ox: number) => {
    const source = toCanvas(index);
    if (!source) return;
    const lift = toDelta(ox * 0.45, -0.16);
    const delta = toDelta(ox, -0.18);
    controls.push({
      x: source.x + lift.x,
      y: source.y + lift.y,
      dx: delta.x * pulse,
      dy: delta.y * pulse,
      radius: 0.34 * faceWidth,
    });
  };
  pushHornTip(103, -0.12);
  pushHornTip(332, 0.12);

  const leftEyeOuter = toCanvas(33);
  const leftEyeInner = toCanvas(133);
  const rightEyeOuter = toCanvas(263);
  const rightEyeInner = toCanvas(362);
  const leftEye =
    leftEyeOuter && leftEyeInner
      ? displace(
          {
            x: (leftEyeOuter.x + leftEyeInner.x) / 2,
            y: (leftEyeOuter.y + leftEyeInner.y) / 2,
          },
          controls,
          morph
        )
      : null;
  const rightEye =
    rightEyeOuter && rightEyeInner
      ? displace(
          {
            x: (rightEyeOuter.x + rightEyeInner.x) / 2,
            y: (rightEyeOuter.y + rightEyeInner.y) / 2,
          },
          controls,
          morph
        )
      : null;
  const faceCenter = displace(
    {
      x: (forehead.x + chin.x) / 2,
      y: (forehead.y + chin.y) / 2,
    },
    controls,
    morph
  );

  return {
    controls,
    axisX,
    axisY,
    faceWidth,
    faceCenter,
    leftEye,
    rightEye,
  };
}

function separateCrossedEdges(
  source: Float32Array,
  destination: Float32Array,
  stride: number,
  rows: number,
  columns: number,
  vertical: boolean
) {
  const rowCount = vertical ? rows : rows + 1;
  const columnCount = vertical ? columns + 1 : columns;
  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const start = row * stride + column;
      const end = start + (vertical ? stride : 1);
      const sourceDelta = source[end] - source[start];
      const destinationDelta = destination[end] - destination[start];
      if (sourceDelta * destinationDelta >= 0) continue;
      const mid = (destination[start] + destination[end]) / 2;
      const half = Math.abs(sourceDelta) * 0.5;
      const sign = sourceDelta >= 0 ? 1 : -1;
      destination[start] = mid - sign * half;
      destination[end] = mid + sign * half;
    }
  }
}

export function createDevilFaceWarp(
  canvas: HTMLCanvasElement
): DevilFaceWarp | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
  });
  if (!gl) return null;

  const program = createWarpProgram(gl);
  const positionBuffer = gl.createBuffer();
  const texCoordBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (
    !program ||
    !positionBuffer ||
    !texCoordBuffer ||
    !indexBuffer ||
    !texture
  ) {
    if (program) gl.deleteProgram(program);
    return null;
  }

  const uniforms = {
    texture: gl.getUniformLocation(program, "uTexture"),
    resolution: gl.getUniformLocation(program, "uResolution"),
    faceCenter: gl.getUniformLocation(program, "uFaceCenter"),
    axisX: gl.getUniformLocation(program, "uAxisX"),
    axisY: gl.getUniformLocation(program, "uAxisY"),
    faceWidth: gl.getUniformLocation(program, "uFaceWidth"),
    morph: gl.getUniformLocation(program, "uMorph"),
    eyeLeft: gl.getUniformLocation(program, "uEyeLeft"),
    eyeRight: gl.getUniformLocation(program, "uEyeRight"),
    eyeRadius: gl.getUniformLocation(program, "uEyeRadius"),
  };
  const positions = new Float32Array(VERTEX_COUNT * 2);
  const texCoords = new Float32Array(VERTEX_COUNT * 2);
  const sourceX = new Float32Array(VERTEX_COUNT);
  const sourceY = new Float32Array(VERTEX_COUNT);
  const destinationX = new Float32Array(VERTEX_COUNT);
  const destinationY = new Float32Array(VERTEX_COUNT);
  let viewWidth = 0;
  let viewHeight = 0;
  let pixelRatio = 1;

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, createIndices(), gl.STATIC_DRAW);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 255])
  );

  function restoreState() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.uniform1i(uniforms.texture, 0);
  }

  function resize(nextWidth: number, nextHeight: number) {
    viewWidth = nextWidth;
    viewHeight = nextHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const bufferWidth = Math.max(1, Math.round(nextWidth * pixelRatio));
    const bufferHeight = Math.max(1, Math.round(nextHeight * pixelRatio));
    const sizeChanged =
      canvas.width !== bufferWidth || canvas.height !== bufferHeight;
    if (sizeChanged) {
      canvas.width = bufferWidth;
      canvas.height = bufferHeight;
      restoreState();
    } else {
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  function clear() {
    if (gl.isContextLost()) return;
    restoreState();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function render(frame: DevilFaceWarpFrame) {
    if (gl.isContextLost() || viewWidth <= 0 || viewHeight <= 0) return;
    if (frame.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    if (frame.video.videoWidth <= 0 || frame.video.videoHeight <= 0) return;

    const cover = getCoverTransform(
      frame.video.videoWidth,
      frame.video.videoHeight,
      viewWidth,
      viewHeight
    );
    if (!cover) return;

    const morph = clamp(frame.morph, 0, 1);
    const field =
      frame.landmarks && morph > 0.001
        ? buildControls(frame.landmarks, cover, morph, frame.timeMs)
        : null;
    const controls = field?.controls ?? [];
    const stride = GRID_COLUMNS + 1;

    for (let row = 0; row <= GRID_ROWS; row += 1) {
      const y = (row / GRID_ROWS) * viewHeight;
      for (let column = 0; column <= GRID_COLUMNS; column += 1) {
        const x = (column / GRID_COLUMNS) * viewWidth;
        const index = row * stride + column;
        const destination =
          controls.length > 0 ? displace({ x, y }, controls, morph) : { x, y };
        sourceX[index] = x;
        sourceY[index] = y;
        destinationX[index] = destination.x;
        destinationY[index] = destination.y;
        const texX = (x - cover.offsetX) / cover.drawWidth;
        const texY = (y - cover.offsetY) / cover.drawHeight;
        texCoords[index * 2] = texX;
        texCoords[index * 2 + 1] = 1 - texY;
      }
    }

    if (controls.length > 0) {
      separateCrossedEdges(
        sourceX,
        destinationX,
        stride,
        GRID_ROWS,
        GRID_COLUMNS,
        false
      );
      separateCrossedEdges(
        sourceY,
        destinationY,
        stride,
        GRID_ROWS,
        GRID_COLUMNS,
        true
      );
    }

    for (let index = 0; index < VERTEX_COUNT; index += 1) {
      positions[index * 2] = (destinationX[index] / viewWidth) * 2 - 1;
      positions[index * 2 + 1] = 1 - (destinationY[index] / viewHeight) * 2;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      frame.video
    );
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.morph, field ? morph : 0);
    if (field) {
      gl.uniform2f(
        uniforms.faceCenter,
        field.faceCenter.x * pixelRatio,
        field.faceCenter.y * pixelRatio
      );
      gl.uniform2f(uniforms.axisX, field.axisX.x, field.axisX.y);
      gl.uniform2f(uniforms.axisY, field.axisY.x, field.axisY.y);
      gl.uniform1f(uniforms.faceWidth, field.faceWidth * pixelRatio);
      gl.uniform2f(
        uniforms.eyeLeft,
        (field.leftEye?.x ?? 0) * pixelRatio,
        (field.leftEye?.y ?? 0) * pixelRatio
      );
      gl.uniform2f(
        uniforms.eyeRight,
        (field.rightEye?.x ?? 0) * pixelRatio,
        (field.rightEye?.y ?? 0) * pixelRatio
      );
      gl.uniform1f(
        uniforms.eyeRadius,
        field.faceWidth *
          (field.leftEye && field.rightEye ? 0.11 : 0) *
          pixelRatio
      );
    }
    gl.drawElements(gl.TRIANGLES, INDEX_COUNT, gl.UNSIGNED_SHORT, 0);
  }

  function destroy() {
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(texCoordBuffer);
    gl.deleteBuffer(indexBuffer);
    gl.deleteTexture(texture);
    gl.deleteProgram(program);
  }

  restoreState();

  return { resize, render, clear, destroy };
}
