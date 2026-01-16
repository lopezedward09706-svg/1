
export enum BranchType {
  C_CONSTANT = 'R-QNT-C',
  C_VARIABLE = 'R-QNT-V'
}

export enum ParticleType {
  PROTON = 'Proton',
  ELECTRON = 'Electron',
  NEUTRON = 'Neutron'
}

export interface Knot {
  id: string;
  type: ParticleType;
  position: [number, number, number];
  mass: number;
  chirality: number; // +1, -1, 0
}

export interface SimulationState {
  branch: BranchType;
  networkSize: number;
  timeStep: number;
  isPaused: boolean;
  knots: Knot[];
  showTorsion: boolean;
  showStringDensity: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  isThinking?: boolean;
}
