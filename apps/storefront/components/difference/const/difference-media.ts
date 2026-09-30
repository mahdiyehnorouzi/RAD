const trace = (name: string) => `/difference/trace/${name}.webp`;

export const differenceMedia = {
  hero: { src: trace("hero-bowl"), width: 1024, height: 768 },
  traces: {
    hand: trace("hands"),
    material: trace("glaze"),
    idea: trace("sketch"),
  },
  journey: {
    clay: trace("clay"),
    shape: trace("throw"),
    glaze: trace("glazing"),
    fire: trace("kiln"),
    rad: trace("final"),
  },
  compare: {
    industrial: trace("industrial"),
    rad: trace("handmade"),
  },
  museum: trace("group"),
  quote: trace("clay-blocks"),
} as const;
