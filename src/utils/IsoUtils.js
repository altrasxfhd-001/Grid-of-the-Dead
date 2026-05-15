export const TILE_W = 64;
export const TILE_H = 32;
export const GRID = 30;
export const ISO_ORIGIN = { x: 450, y: 80 }; // W / 2 = 450

export function toIso(gx, gy) {
  return {
    x: ISO_ORIGIN.x + (gx - gy) * (TILE_W / 2),
    y: ISO_ORIGIN.y + (gx + gy) * (TILE_H / 2)
  };
}

export function fromIso(x, y) {
  const relX = x - ISO_ORIGIN.x;
  const relY = y - ISO_ORIGIN.y;
  return {
    gx: (relY / (TILE_H / 2) + relX / (TILE_W / 2)) / 2,
    gy: (relY / (TILE_H / 2) - relX / (TILE_W / 2)) / 2
  };
}
