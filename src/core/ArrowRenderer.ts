import * as THREE from 'three';
import type { DensityDiffConfig, DensityDiffResult, ElectronTransferArrow } from '@/types';
import { arrowMaterialGain, arrowMaterialLoss } from '@/config/materials';

export class ArrowRenderer {
  private group: THREE.Group;
  private shaftGeom: THREE.CylinderGeometry;
  private headGeom: THREE.ConeGeometry;
  private instancedShaftsGain!: THREE.InstancedMesh;
  private instancedHeadsGain!: THREE.InstancedMesh;
  private instancedShaftsLoss!: THREE.InstancedMesh;
  private instancedHeadsLoss!: THREE.InstancedMesh;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'electron-transfer-arrows';
    this.shaftGeom = new THREE.CylinderGeometry(1, 1, 1, 10, 1);
    this.headGeom = new THREE.ConeGeometry(1, 1, 12, 1);
    this.initInstanced(2);
  }

  private initInstanced(max: number): void {
    const old = [
      this.instancedShaftsGain,
      this.instancedHeadsGain,
      this.instancedShaftsLoss,
      this.instancedHeadsLoss,
    ];
    old.forEach((m) => m && this.group.remove(m));

    this.instancedShaftsGain = new THREE.InstancedMesh(
      this.shaftGeom,
      arrowMaterialGain,
      max
    );
    this.instancedHeadsGain = new THREE.InstancedMesh(
      this.headGeom,
      arrowMaterialGain,
      max
    );
    this.instancedShaftsLoss = new THREE.InstancedMesh(
      this.shaftGeom,
      arrowMaterialLoss,
      max
    );
    this.instancedHeadsLoss = new THREE.InstancedMesh(
      this.headGeom,
      arrowMaterialLoss,
      max
    );
    this.instancedShaftsGain.count = 0;
    this.instancedHeadsGain.count = 0;
    this.instancedShaftsLoss.count = 0;
    this.instancedHeadsLoss.count = 0;
    this.instancedShaftsGain.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedHeadsGain.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedShaftsLoss.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedHeadsLoss.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(
      this.instancedShaftsGain,
      this.instancedHeadsGain,
      this.instancedShaftsLoss,
      this.instancedHeadsLoss
    );
  }

  private buildArrowTransform(
    arrow: ElectronTransferArrow,
    config: DensityDiffConfig,
    isHead: boolean,
    tgtMag: number
  ): THREE.Matrix4 {
    const { arrowScale, headLengthRatio, shaftRadius } = config;
    const f = new THREE.Vector3(arrow.from.x, arrow.from.y, arrow.from.z);
    const t = new THREE.Vector3(arrow.to.x, arrow.to.y, arrow.to.z);
    const dir = new THREE.Vector3().subVectors(t, f);
    const totalLen = dir.length() * arrowScale * (0.4 + 0.6 * Math.min(1, arrow.magnitude / Math.max(0.001, tgtMag)));
    dir.normalize();

    const headLen = totalLen * headLengthRatio;
    const shaftLen = totalLen - headLen;

    const center = new THREE.Vector3();
    let scale: THREE.Vector3;
    if (isHead) {
      scale = new THREE.Vector3(shaftRadius * 3.6, headLen, shaftRadius * 3.6);
      center.copy(f).addScaledVector(dir, shaftLen + headLen * 0.5);
    } else {
      scale = new THREE.Vector3(shaftRadius, shaftLen, shaftRadius);
      center.copy(f).addScaledVector(dir, shaftLen * 0.5);
    }

    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
    const m = new THREE.Matrix4();
    m.compose(center, q, scale);
    return m;
  }

  render(result: DensityDiffResult, config: DensityDiffConfig): THREE.Group {
    const arrows = result.arrows.filter((a) => {
      if (a.direction === 'gain' && !config.showGain) return false;
      if (a.direction === 'loss' && !config.showLoss) return false;
      return true;
    });

    const maxInst = Math.max(2, arrows.length);
    if (
      maxInst > this.instancedShaftsGain.count + 10 ||
      maxInst > this.instancedShaftsGain.instanceMatrix.count
    ) {
      this.initInstanced(maxInst * 2);
    }

    const tgtMag = Math.max(result.maxMagnitude, 0.001);
    const dummy = new THREE.Matrix4();
    let gainIdx = 0;
    let lossIdx = 0;

    for (const arrow of arrows) {
      const matGain = arrow.chargeDelta > 0;
      const shaftM = this.buildArrowTransform(arrow, config, false, tgtMag);
      const headM = this.buildArrowTransform(arrow, config, true, tgtMag);
      if (matGain) {
        this.instancedShaftsGain.setMatrixAt(gainIdx, shaftM);
        this.instancedHeadsGain.setMatrixAt(gainIdx, headM);
        gainIdx++;
      } else {
        this.instancedShaftsLoss.setMatrixAt(lossIdx, shaftM);
        this.instancedHeadsLoss.setMatrixAt(lossIdx, headM);
        lossIdx++;
      }
    }

    this.instancedShaftsGain.count = gainIdx;
    this.instancedHeadsGain.count = gainIdx;
    this.instancedShaftsLoss.count = lossIdx;
    this.instancedHeadsLoss.count = lossIdx;

    this.instancedShaftsGain.instanceMatrix.needsUpdate = true;
    this.instancedHeadsGain.instanceMatrix.needsUpdate = true;
    this.instancedShaftsLoss.instanceMatrix.needsUpdate = true;
    this.instancedHeadsLoss.instanceMatrix.needsUpdate = true;

    this.instancedShaftsGain.visible = config.showGain;
    this.instancedHeadsGain.visible = config.showGain;
    this.instancedShaftsLoss.visible = config.showLoss;
    this.instancedHeadsLoss.visible = config.showLoss;

    this.group.matrixWorldNeedsUpdate = true;
    return this.group;
  }

  clear(): void {
    this.instancedShaftsGain.count = 0;
    this.instancedHeadsGain.count = 0;
    this.instancedShaftsLoss.count = 0;
    this.instancedHeadsLoss.count = 0;
    this.instancedShaftsGain.instanceMatrix.needsUpdate = true;
    this.instancedHeadsGain.instanceMatrix.needsUpdate = true;
    this.instancedShaftsLoss.instanceMatrix.needsUpdate = true;
    this.instancedHeadsLoss.instanceMatrix.needsUpdate = true;
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  dispose(): void {
    this.shaftGeom.dispose();
    this.headGeom.dispose();
    arrowMaterialGain.dispose();
    arrowMaterialLoss.dispose();
    this.clear();
  }
}
