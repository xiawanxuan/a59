import type { IsosurfaceMesh, Vec3 } from '@/types';
import { EDGE_TABLE, TRI_TABLE } from './MarchingCubesTables';

export interface GridBounds {
  min: Vec3;
  max: Vec3;
}

export class MarchingCubes {
  private gridRes: number;
  private bounds: GridBounds;
  private nx: number;
  private ny: number;
  private nz: number;
  private values: Float32Array;

  constructor(bounds: GridBounds, resolution: number) {
    this.bounds = bounds;
    this.gridRes = resolution;
    const dx = bounds.max.x - bounds.min.x;
    const dy = bounds.max.y - bounds.min.y;
    const dz = bounds.max.z - bounds.min.z;
    this.nx = Math.max(4, Math.ceil(dx / resolution) + 1);
    this.ny = Math.max(4, Math.ceil(dy / resolution) + 1);
    this.nz = Math.max(4, Math.ceil(dz / resolution) + 1);
    this.values = new Float32Array(this.nx * this.ny * this.nz);
  }

  get dims() {
    return { nx: this.nx, ny: this.ny, nz: this.nz };
  }

  setValues(fn: (x: number, y: number, z: number) => number): void {
    const { min } = this.bounds;
    const { nx, ny, nz, gridRes } = this;
    for (let iz = 0; iz < nz; iz++) {
      for (let iy = 0; iy < ny; iy++) {
        for (let ix = 0; ix < nx; ix++) {
          const x = min.x + ix * gridRes;
          const y = min.y + iy * gridRes;
          const z = min.z + iz * gridRes;
          this.values[ix + iy * nx + iz * nx * ny] = fn(x, y, z);
        }
      }
    }
  }

  private idx(i: number, j: number, k: number): number {
    return i + j * this.nx + k * this.nx * this.ny;
  }

  private vertexInterp(
    isolevel: number,
    p1: Vec3, p2: Vec3, v1: number, v2: number
  ): Vec3 {
    if (Math.abs(isolevel - v1) < 1e-5) return { ...p1 };
    if (Math.abs(isolevel - v2) < 1e-5) return { ...p2 };
    if (Math.abs(v1 - v2) < 1e-5) return { ...p1 };
    const t = (isolevel - v1) / (v2 - v1);
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
      z: p1.z + t * (p2.z - p1.z),
    };
  }

  buildIsosurface(isolevel: number): IsosurfaceMesh {
    const { min } = this.bounds;
    const { nx, ny, nz, gridRes } = this;
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    const vertList: (Vec3 | null)[] = new Array(12);
    const vertexMap = new Map<string, number>();

    const addVertex = (v: Vec3, normalVec: Vec3): number => {
      const key = `${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`;
      if (vertexMap.has(key)) return vertexMap.get(key)!;
      const idx = positions.length / 3;
      positions.push(v.x, v.y, v.z);
      const len = Math.sqrt(normalVec.x ** 2 + normalVec.y ** 2 + normalVec.z ** 2) || 1;
      normals.push(normalVec.x / len, normalVec.y / len, normalVec.z / len);
      vertexMap.set(key, idx);
      return idx;
    };

    for (let iz = 0; iz < nz - 1; iz++) {
      for (let iy = 0; iy < ny - 1; iy++) {
        for (let ix = 0; ix < nx - 1; ix++) {
          const p = [
            { x: min.x + ix * gridRes, y: min.y + iy * gridRes, z: min.z + iz * gridRes },
            { x: min.x + (ix + 1) * gridRes, y: min.y + iy * gridRes, z: min.z + iz * gridRes },
            { x: min.x + (ix + 1) * gridRes, y: min.y + (iy + 1) * gridRes, z: min.z + iz * gridRes },
            { x: min.x + ix * gridRes, y: min.y + (iy + 1) * gridRes, z: min.z + iz * gridRes },
            { x: min.x + ix * gridRes, y: min.y + iy * gridRes, z: min.z + (iz + 1) * gridRes },
            { x: min.x + (ix + 1) * gridRes, y: min.y + iy * gridRes, z: min.z + (iz + 1) * gridRes },
            { x: min.x + (ix + 1) * gridRes, y: min.y + (iy + 1) * gridRes, z: min.z + (iz + 1) * gridRes },
            { x: min.x + ix * gridRes, y: min.y + (iy + 1) * gridRes, z: min.z + (iz + 1) * gridRes },
          ];
          const v = [
            this.values[this.idx(ix, iy, iz)],
            this.values[this.idx(ix + 1, iy, iz)],
            this.values[this.idx(ix + 1, iy + 1, iz)],
            this.values[this.idx(ix, iy + 1, iz)],
            this.values[this.idx(ix, iy, iz + 1)],
            this.values[this.idx(ix + 1, iy, iz + 1)],
            this.values[this.idx(ix + 1, iy + 1, iz + 1)],
            this.values[this.idx(ix, iy + 1, iz + 1)],
          ];

          let cubeIndex = 0;
          for (let i = 0; i < 8; i++) {
            if (v[i] < isolevel) cubeIndex |= 1 << i;
          }

          if (EDGE_TABLE[cubeIndex] === 0) continue;

          const edges = EDGE_TABLE[cubeIndex];
          if (edges & 1) vertList[0] = this.vertexInterp(isolevel, p[0], p[1], v[0], v[1]);
          if (edges & 2) vertList[1] = this.vertexInterp(isolevel, p[1], p[2], v[1], v[2]);
          if (edges & 4) vertList[2] = this.vertexInterp(isolevel, p[2], p[3], v[2], v[3]);
          if (edges & 8) vertList[3] = this.vertexInterp(isolevel, p[3], p[0], v[3], v[0]);
          if (edges & 16) vertList[4] = this.vertexInterp(isolevel, p[4], p[5], v[4], v[5]);
          if (edges & 32) vertList[5] = this.vertexInterp(isolevel, p[5], p[6], v[5], v[6]);
          if (edges & 64) vertList[6] = this.vertexInterp(isolevel, p[6], p[7], v[6], v[7]);
          if (edges & 128) vertList[7] = this.vertexInterp(isolevel, p[7], p[4], v[7], v[4]);
          if (edges & 256) vertList[8] = this.vertexInterp(isolevel, p[0], p[4], v[0], v[4]);
          if (edges & 512) vertList[9] = this.vertexInterp(isolevel, p[1], p[5], v[1], v[5]);
          if (edges & 1024) vertList[10] = this.vertexInterp(isolevel, p[2], p[6], v[2], v[6]);
          if (edges & 2048) vertList[11] = this.vertexInterp(isolevel, p[3], p[7], v[3], v[7]);

          const tri = TRI_TABLE[cubeIndex];
          for (let i = 0; tri[i] !== -1; i += 3) {
            for (let j = 0; j < 3; j++) {
              const vert = vertList[tri[i + j]]!;
              const gx = this.gradX(vert);
              const gy = this.gradY(vert);
              const gz = this.gradZ(vert);
              const idx = addVertex(vert, { x: gx, y: gy, z: gz });
              indices.push(idx);
            }
          }
          for (let i = 0; i < 12; i++) vertList[i] = null;
        }
      }
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      indices: new Uint32Array(indices),
    };
  }

  private gradX(pos: Vec3): number {
    const h = this.gridRes * 0.5;
    const fx = this.sample(pos.x + h, pos.y, pos.z);
    const bx = this.sample(pos.x - h, pos.y, pos.z);
    return (fx - bx) / (2 * h);
  }

  private gradY(pos: Vec3): number {
    const h = this.gridRes * 0.5;
    const fy = this.sample(pos.x, pos.y + h, pos.z);
    const by = this.sample(pos.x, pos.y - h, pos.z);
    return (fy - by) / (2 * h);
  }

  private gradZ(pos: Vec3): number {
    const h = this.gridRes * 0.5;
    const fz = this.sample(pos.x, pos.y, pos.z + h);
    const bz = this.sample(pos.x, pos.y, pos.z - h);
    return (fz - bz) / (2 * h);
  }

  private sample(x: number, y: number, z: number): number {
    const { min } = this.bounds;
    const { nx, ny, nz, gridRes } = this;
    const ix = (x - min.x) / gridRes;
    const iy = (y - min.y) / gridRes;
    const iz = (z - min.z) / gridRes;
    const i0 = Math.max(0, Math.min(nx - 2, Math.floor(ix)));
    const j0 = Math.max(0, Math.min(ny - 2, Math.floor(iy)));
    const k0 = Math.max(0, Math.min(nz - 2, Math.floor(iz)));
    const tx = ix - i0;
    const ty = iy - j0;
    const tz = iz - k0;
    const c000 = this.values[this.idx(i0, j0, k0)];
    const c100 = this.values[this.idx(i0 + 1, j0, k0)];
    const c010 = this.values[this.idx(i0, j0 + 1, k0)];
    const c110 = this.values[this.idx(i0 + 1, j0 + 1, k0)];
    const c001 = this.values[this.idx(i0, j0, k0 + 1)];
    const c101 = this.values[this.idx(i0 + 1, j0, k0 + 1)];
    const c011 = this.values[this.idx(i0, j0 + 1, k0 + 1)];
    const c111 = this.values[this.idx(i0 + 1, j0 + 1, k0 + 1)];
    const c00 = c000 * (1 - tx) + c100 * tx;
    const c10 = c010 * (1 - tx) + c110 * tx;
    const c01 = c001 * (1 - tx) + c101 * tx;
    const c11 = c011 * (1 - tx) + c111 * tx;
    const c0 = c00 * (1 - ty) + c10 * ty;
    const c1 = c01 * (1 - ty) + c11 * ty;
    return c0 * (1 - tz) + c1 * tz;
  }
}
