import type {
  Atom,
  DensityDiffConfig,
  DensityDiffResult,
  ElectronTransferArrow,
  Molecule,
  Orbital,
  Vec3,
} from '@/types';

const STO_EXP_S = 1.2;
const STO_EXP_P = 1.8;

function sTypeAO(r2: number, z: number): number {
  const exp = z > 2 ? STO_EXP_S * 2.5 : STO_EXP_S * 1.0;
  return Math.exp(-exp * r2);
}
function pxTypeAO(dx: number, r2: number): number {
  return dx * Math.exp(-STO_EXP_P * r2);
}
function pyTypeAO(dy: number, r2: number): number {
  return dy * Math.exp(-STO_EXP_P * r2);
}
function pzTypeAO(dz: number, r2: number): number {
  return dz * Math.exp(-STO_EXP_P * r2);
}

function evaluateOrbitalAt(
  orbital: Orbital,
  atoms: Atom[],
  pos: Vec3
): number {
  const coeffs = orbital.coefficients;
  let val = 0;
  let cIdx = 0;
  for (let i = 0; i < atoms.length && cIdx < coeffs.length; i++) {
    const a = atoms[i];
    const dx = pos.x - a.position.x;
    const dy = pos.y - a.position.y;
    const dz = pos.z - a.position.z;
    const r2 = dx * dx + dy * dy + dz * dz;
    val += (coeffs[cIdx++] || 0) * sTypeAO(r2, a.atomicNumber);
    if (a.atomicNumber > 1 && cIdx < coeffs.length)
      val += (coeffs[cIdx++] || 0) * pxTypeAO(dx, r2);
    if (a.atomicNumber > 1 && cIdx < coeffs.length)
      val += (coeffs[cIdx++] || 0) * pyTypeAO(dy, r2);
    if (a.atomicNumber > 1 && cIdx < coeffs.length)
      val += (coeffs[cIdx++] || 0) * pzTypeAO(dz, r2);
  }
  return val;
}

function mullikenPerAtom(orbital: Orbital, atoms: Atom[]): Float32Array {
  const out = new Float32Array(atoms.length);
  const coeffs = orbital.coefficients;
  let cIdx = 0;
  for (let i = 0; i < atoms.length && cIdx < coeffs.length; i++) {
    const a = atoms[i];
    let s2 = 0;
    let sp = 0;
    const cs = coeffs[cIdx++] || 0;
    s2 += cs * cs;
    const cpx = a.atomicNumber > 1 && cIdx < coeffs.length ? coeffs[cIdx++] || 0 : 0;
    const cpy = a.atomicNumber > 1 && cIdx < coeffs.length ? coeffs[cIdx++] || 0 : 0;
    const cpz = a.atomicNumber > 1 && cIdx < coeffs.length ? coeffs[cIdx++] || 0 : 0;
    sp = cpx * cpx + cpy * cpy + cpz * cpz;
    out[i] = s2 + 0.85 * sp;
  }
  const norm = out.reduce((s, v) => s + v, 0) || 1;
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

function densityOnAtomGrid(
  mol: Molecule,
  mode: 'orbital' | 'total',
  orbitalIndex: number
): Float32Array {
  const n = mol.atoms.length;
  const rho = new Float32Array(n);
  if (mode === 'orbital') {
    const orb = mol.orbitals[orbitalIndex];
    if (!orb) return rho;
    const pop = mullikenPerAtom(orb, mol.atoms);
    for (let i = 0; i < n; i++) rho[i] = pop[i];
    return rho;
  }
  const homo = mol.homoIndex;
  for (let oi = 0; oi <= homo && oi < mol.orbitals.length; oi++) {
    const orb = mol.orbitals[oi];
    if (!orb || !orb.occupied) continue;
    const pop = mullikenPerAtom(orb, mol.atoms);
    for (let i = 0; i < n; i++) rho[i] += 2.0 * pop[i];
  }
  return rho;
}

function alignAtoms(reactant: Molecule, product: Molecule): number[] {
  const rMap = new Map<string, number>();
  const prodToReact = new Array(product.atoms.length).fill(-1);
  for (let i = 0; i < reactant.atoms.length; i++) {
    const a = reactant.atoms[i];
    rMap.set(`${a.element}_${i}`, i);
  }
  for (let i = 0; i < product.atoms.length; i++) {
    const b = product.atoms[i];
    const key = `${b.element}_${i}`;
    if (rMap.has(key)) {
      prodToReact[i] = rMap.get(key)!;
    } else {
      let best = -1;
      let bestD = Infinity;
      for (let j = 0; j < reactant.atoms.length; j++) {
        const ra = reactant.atoms[j];
        if (ra.element !== b.element) continue;
        const dx = ra.position.x - b.position.x;
        const dy = ra.position.y - b.position.y;
        const dz = ra.position.z - b.position.z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bestD) {
          bestD = d;
          best = j;
        }
      }
      prodToReact[i] = best;
    }
  }
  return prodToReact;
}

function dist2(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

export class DensityDiffEngine {
  static compute(
    reactant: Molecule,
    product: Molecule,
    selectedOrbitalIndex: number,
    config: DensityDiffConfig
  ): DensityDiffResult {
    const { minMagnitude, maxArrows } = config;
    const effectiveMode: 'orbital' | 'total' =
      config.mode === 'off' ? 'orbital' : config.mode;
    const prodToReact = alignAtoms(reactant, product);

    const rRho = densityOnAtomGrid(reactant, effectiveMode, selectedOrbitalIndex);
    const pRho = densityOnAtomGrid(product, effectiveMode, selectedOrbitalIndex);

    const n = product.atoms.length;
    const deltas = new Float32Array(n);
    const atomDeltas: DensityDiffResult['atomDeltas'] = [];
    let maxMag = 0;
    let netTransfer = 0;

    for (let i = 0; i < n; i++) {
      const ri = prodToReact[i];
      const before = ri >= 0 && ri < rRho.length ? rRho[ri] : 0;
      const after = pRho[i];
      const d = after - before;
      deltas[i] = d;
      netTransfer += Math.abs(d);
      const mag = Math.abs(d);
      if (mag > maxMag) maxMag = mag;
      atomDeltas.push({ atomIndex: i, delta: d, magnitude: mag });
    }
    netTransfer *= 0.5;

    const candidates: ElectronTransferArrow[] = [];
    const givers: number[] = [];
    const receivers: number[] = [];
    for (let i = 0; i < n; i++) {
      if (deltas[i] < -minMagnitude) givers.push(i);
      else if (deltas[i] > minMagnitude) receivers.push(i);
    }

    for (const g of givers) {
      const gAtom = product.atoms[g];
      const shareTotal = Math.abs(deltas[g]);
      let rem = shareTotal;
      const localRcvs = receivers
        .map((r) => ({ r, d: dist2(gAtom.position, product.atoms[r].position) }))
        .filter((x) => x.d < 25)
        .sort((a, b) => a.d - b.d)
        .slice(0, 6);

      const sumW = localRcvs.reduce((s, x) => s + Math.max(0.001, 1 / (1 + x.d)), 0);
      for (const { r, d } of localRcvs) {
        if (rem <= 0) break;
        const w = Math.max(0.001, 1 / (1 + d)) / sumW;
        let amt = Math.min(rem, Math.abs(deltas[r]) * w * 1.5);
        if (amt < minMagnitude * 0.4) continue;
        const from: Vec3 = {
          x: gAtom.position.x,
          y: gAtom.position.y,
          z: gAtom.position.z,
        };
        const toPos = product.atoms[r].position;
        const to: Vec3 = { x: toPos.x, y: toPos.y, z: toPos.z };
        const mag = Math.abs(amt);
        candidates.push({
          id: `arrow_${g}_${r}`,
          fromAtomIndex: g,
          toAtomIndex: r,
          from,
          to,
          chargeDelta: amt,
          magnitude: mag,
          direction: 'loss',
        });
        rem -= amt;
      }
    }

    candidates.sort((a, b) => b.magnitude - a.magnitude);
    const arrows = candidates.slice(0, maxArrows);
    atomDeltas.sort((a, b) => b.magnitude - a.magnitude);

    return {
      arrows,
      atomDeltas,
      netTransfer,
      maxMagnitude: maxMag,
    };
  }

  static sampleOrbitalDensityAtAtomCenters(
    mol: Molecule,
    orbitalIndex: number
  ): Float32Array {
    const orb = mol.orbitals[orbitalIndex];
    const out = new Float32Array(mol.atoms.length);
    if (!orb) return out;
    for (let i = 0; i < mol.atoms.length; i++) {
      const a = mol.atoms[i];
      const v = evaluateOrbitalAt(orb, mol.atoms, a.position);
      out[i] = v * v;
    }
    return out;
  }
}
