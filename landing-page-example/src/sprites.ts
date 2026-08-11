export type SpritePoint = [x: number, y: number, z: number];

export type LandmarkSpriteConfig = {
  id: string;
  city: 1 | 2 | 3 | 4;
  src: string;
  entryPoint: SpritePoint;
  focalPoint: SpritePoint;
  exitPoint: SpritePoint;
  scale: [width: number, height: number];
  direction: -1 | 1;
  orbitSize: number;
  opacity: number;
  focalPosition: number;
};

export const landmarkSprites: LandmarkSpriteConfig[] = [
  {
    id: "giza-pyramids",
    city: 1,
    src: "/sprites/cairo-pyramids.webp",
    entryPoint: [-4.2, 1.16, -0.55],
    focalPoint: [2.15, -0.72, 0.36],
    exitPoint: [3.9, 1.05, -0.52],
    scale: [1.85, 1.5],
    direction: 1,
    orbitSize: 0.42,
    opacity: 0.88,
    focalPosition: 0.3,
  },
  {
    id: "great-sphinx",
    city: 1,
    src: "/sprites/cairo-sphinx.webp",
    entryPoint: [4.1, 1.2, -0.5],
    focalPoint: [2.18, 0.5, 0.42],
    exitPoint: [-3.8, 1.16, -0.48],
    scale: [1.46, 1.46],
    direction: -1,
    orbitSize: 0.36,
    opacity: 0.86,
    focalPosition: 0.7,
  },
  {
    id: "eiffel-tower",
    city: 2,
    src: "/sprites/paris-eiffel.webp",
    entryPoint: [3.8, -1.5, -0.58],
    focalPoint: [2.08, 0.12, 0.45],
    exitPoint: [-3.9, 1.25, -0.5],
    scale: [1.18, 1.78],
    direction: -1,
    orbitSize: 0.44,
    opacity: 0.86,
    focalPosition: 0.28,
  },
  {
    id: "pont-alexandre-iii",
    city: 2,
    src: "/sprites/paris-pont-alexandre-iii.webp",
    entryPoint: [-4.25, -1.15, -0.55],
    focalPoint: [2.12, -0.82, 0.38],
    exitPoint: [4.2, -0.92, -0.48],
    scale: [2.16, 1.44],
    direction: 1,
    orbitSize: 0.34,
    opacity: 0.82,
    focalPosition: 0.72,
  },
  {
    id: "empire-state-building",
    city: 3,
    src: "/sprites/new-york-empire-state.webp",
    entryPoint: [-3.8, 1.28, -0.58],
    focalPoint: [2.12, 0.38, 0.4],
    exitPoint: [3.8, 1.22, -0.48],
    scale: [1.0, 1.58],
    direction: 1,
    orbitSize: 0.38,
    opacity: 0.84,
    focalPosition: 0.18,
  },
  {
    id: "statue-of-liberty",
    city: 3,
    src: "/sprites/new-york-statue-liberty.webp",
    entryPoint: [4.0, 1.35, -0.52],
    focalPoint: [2.18, -0.15, 0.44],
    exitPoint: [-4.0, 1.18, -0.5],
    scale: [0.98, 1.48],
    direction: -1,
    orbitSize: 0.4,
    opacity: 0.84,
    focalPosition: 0.5,
  },
  {
    id: "brooklyn-bridge",
    city: 3,
    src: "/sprites/new-york-brooklyn-bridge.webp",
    entryPoint: [4.3, -1.0, -0.6],
    focalPoint: [2.12, -0.78, 0.34],
    exitPoint: [-4.2, 1.05, -0.5],
    scale: [2.12, 1.42],
    direction: 1,
    orbitSize: 0.3,
    opacity: 0.8,
    focalPosition: 0.81,
  },
  {
    id: "les-eclaireurs-lighthouse",
    city: 4,
    src: "/sprites/ushuaia-lighthouse.webp",
    entryPoint: [4.0, -1.25, -0.58],
    focalPoint: [2.14, 0.18, 0.44],
    exitPoint: [-3.9, 1.18, -0.5],
    scale: [2.0, 1.33],
    direction: -1,
    orbitSize: 0.38,
    opacity: 0.86,
    focalPosition: 0.3,
  },
  {
    id: "end-of-world-train",
    city: 4,
    src: "/sprites/ushuaia-train.webp",
    entryPoint: [-4.35, 1.12, -0.54],
    focalPoint: [2.14, -0.72, 0.4],
    exitPoint: [4.25, -0.92, -0.52],
    scale: [2.08, 1.39],
    direction: 1,
    orbitSize: 0.32,
    opacity: 0.86,
    focalPosition: 0.72,
  },
];
