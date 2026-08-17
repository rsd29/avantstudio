function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createBarrelMap(size = 256, amount = 1.2) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const image = ctx.createImageData(size, size);
  const data = image.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / (size - 1)) * 2 - 1;
      const ny = (y / (size - 1)) * 2 - 1;
      const r2 = Math.min(nx * nx + ny * ny, 1);
      const z = Math.sqrt(1 - r2);
      const k = (1 - z) * amount;
      const i = (y * size + x) * 4;
      data[i] = clamp(Math.round(128 + nx * k * 127), 0, 255);
      data[i + 1] = clamp(Math.round(128 + ny * k * 127), 0, 255);
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}
