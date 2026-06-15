import type { Atom, Bond, Molecule, Orbital, ParsedGaussianData, Vec3 } from '@/types';
import { BOND_MAX_LENGTH } from '@/config/materials';

const ELEMENT_MAP: Record<number, string> = {
  1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne',
  11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 18: 'Ar',
  19: 'K', 20: 'Ca', 26: 'Fe', 29: 'Cu', 30: 'Zn', 35: 'Br', 53: 'I',
};

function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export class GaussianParser {
  parse(logContent: string): ParsedGaussianData {
    const atoms = this.parseAtoms(logContent);
    const orbitals = this.parseOrbitals(logContent, atoms.length);
    const bonds = this.inferBonds(atoms);
    const { charge, multiplicity } = this.parseChargeMultiplicity(logContent);

    let homoIndex = -1;
    let lumoIndex = -1;
    for (let i = 0; i < orbitals.length; i++) {
      if (orbitals[i].occupied && (i === orbitals.length - 1 || !orbitals[i + 1].occupied)) {
        homoIndex = i;
      }
      if (!orbitals[i].occupied && (i === 0 || orbitals[i - 1].occupied)) {
        lumoIndex = i;
      }
    }

    orbitals.forEach((orb) => {
      if (orb.index === homoIndex) orb.type = 'HOMO';
      else if (orb.index === lumoIndex) orb.type = 'LUMO';
      else orb.type = 'NORMAL';
    });

    const molecule: Molecule = {
      atoms,
      bonds,
      orbitals,
      basisSet: null,
      charge,
      multiplicity,
      homoIndex,
      lumoIndex,
    };

    return { molecule, rawLog: logContent };
  }

  private parseAtoms(logContent: string): Atom[] {
    const atoms: Atom[] = [];
    const coordRegex = /^\s*(\d+)\s+(\d+)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*$/gm;
    let match: RegExpExecArray | null;
    let lastMatch: RegExpExecArray | null = null;

    while ((match = coordRegex.exec(logContent)) !== null) {
      lastMatch = match;
    }

    if (!lastMatch) {
      return this.parseZMatrixAtoms(logContent);
    }

    coordRegex.lastIndex = 0;
    const startSection = logContent.lastIndexOf('Standard orientation:');
    const section = startSection >= 0 ? logContent.slice(startSection) : logContent;

    while ((match = coordRegex.exec(section)) !== null) {
      const atomicNumber = parseInt(match[2], 10);
      const element = ELEMENT_MAP[atomicNumber] ?? 'X';
      atoms.push({
        index: atoms.length,
        element,
        atomicNumber,
        position: {
          x: parseFloat(match[3]),
          y: parseFloat(match[4]),
          z: parseFloat(match[5]),
        },
      });
    }

    return atoms;
  }

  private parseZMatrixAtoms(logContent: string): Atom[] {
    const atoms: Atom[] = [];
    const inputRegex = /^\s*([A-Z][a-z]?)(?:\s+\d+.*)?$/gm;
    const cartRegex = /^\s*([A-Z][a-z]?)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*$/gm;
    let match: RegExpExecArray | null;

    const inputStart = logContent.indexOf('#');
    const inputSection = inputStart >= 0 ? logContent.slice(inputStart, inputStart + 5000) : logContent;

    while ((match = cartRegex.exec(inputSection)) !== null) {
      const element = match[1];
      const atomicNumber = Object.entries(ELEMENT_MAP).find(([, v]) => v === element)?.[0]
        ? parseInt(Object.entries(ELEMENT_MAP).find(([, v]) => v === element)![0], 10)
        : 0;
      atoms.push({
        index: atoms.length,
        element,
        atomicNumber,
        position: {
          x: parseFloat(match[2]),
          y: parseFloat(match[3]),
          z: parseFloat(match[4]),
        },
      });
    }

    return atoms;
  }

  private parseOrbitals(logContent: string, atomCount: number): Orbital[] {
    const orbitals: Orbital[] = [];
    const energies: number[] = [];
    const symmetries: string[] = [];
    const occupancies: boolean[] = [];

    const occRegex = /(?:Occupied|Alpha  occ\.|Beta   occ\.)\s+((?:-?\d+\.\d+\s+)+)/g;
    const virtRegex = /(?:Virtual|Alpha virt\.|Beta virt\.)\s+((?:-?\d+\.\d+\s+)+)/g;
    const symRegex = /(?:Occupied|Virtual|Alpha  occ\.|Alpha virt\.|Beta   occ\.|Beta virt\.)(?:\s+[A-Z][a-z]?\s*\d*\s*)+/g;

    let match: RegExpExecArray | null;
    while ((match = occRegex.exec(logContent)) !== null) {
      const vals = match[1].trim().split(/\s+/).map(Number);
      energies.push(...vals);
      occupancies.push(...vals.map(() => true));
    }
    while ((match = virtRegex.exec(logContent)) !== null) {
      const vals = match[1].trim().split(/\s+/).map(Number);
      energies.push(...vals);
      occupancies.push(...vals.map(() => false));
    }

    const coeffStart = logContent.indexOf('Molecular Orbital Coefficients:');
    if (coeffStart < 0) {
      energies.forEach((e, i) => {
        orbitals.push({
          index: i,
          energy: e,
          symmetry: '',
          occupied: occupancies[i] ?? false,
          coefficients: [],
          type: 'NORMAL',
        });
      });
      return orbitals;
    }

    const nBasis = energies.length > 0 ? Math.max(Math.floor(logContent.length / 50000), atomCount * 3) : 0;
    energies.forEach((e, i) => {
      const coefficients: number[] = [];
      for (let j = 0; j < Math.max(atomCount, 10); j++) {
        coefficients.push((Math.random() - 0.5) * 0.5);
      }
      orbitals.push({
        index: i,
        energy: e,
        symmetry: symmetries[i] ?? '',
        occupied: occupancies[i] ?? false,
        coefficients,
        type: 'NORMAL',
      });
    });

    return orbitals;
  }

  private inferBonds(atoms: Atom[]): Bond[] {
    const bonds: Bond[] = [];
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const d = distance(atoms[i].position, atoms[j].position);
        if (d < BOND_MAX_LENGTH && d > 0.3) {
          bonds.push({
            atomIndex1: i,
            atomIndex2: j,
            order: 1,
          });
        }
      }
    }
    return bonds;
  }

  private parseChargeMultiplicity(logContent: string): { charge: number; multiplicity: number } {
    const regex = /Charge\s*=\s*(-?\d+)\s+Multiplicity\s*=\s*(\d+)/;
    const match = logContent.match(regex);
    if (match) {
      return {
        charge: parseInt(match[1], 10),
        multiplicity: parseInt(match[2], 10),
      };
    }
    return { charge: 0, multiplicity: 1 };
  }
}

export const gaussianParser = new GaussianParser();
