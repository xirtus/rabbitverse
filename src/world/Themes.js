// ═══ THEMES — world visual identities: sky, light, palette, deco flavor ═══
import * as THREE from 'three';

export const THEMES = {
  garden: {
    sky: { top:0x2f7fe0, mid:0x8fd4ff, bottom:0xffe9c4 },
    fog: 0xcfe4f2, fogNear:60, fogFar:320, sun:0xfff2d8, exposure:1.06,
    hemiSky:0x9fd8ff, hemiGround:0x6a9f5e,
    top:0x58a83c, side:0x8a5a33, accent:0x3fae5a,   // grass/dirt/leaf
    water:{ deep:0x1a6ab8, shallow:0x3fd4d8 },
    skyMood: {},
  },
  fractal: {
    sky: { top:0x2a0a4a, mid:0x8a2be2, bottom:0xff6ad5 },
    fog: 0x3a1560, fogNear:34, fogFar:200, sun:0xff9adf, exposure:1.12,
    hemiSky:0xc05aff, hemiGround:0x2a0a4a,
    top:0x5a2a9a, side:0x3a1a6a, accent:0xff6ad5, ground:'psych',
    water:{ deep:0x1a0a3a, shallow:0x7a2aff },
    kaleidoscope: true,
  },
  neon: {
    sky: { top:0x05051a, mid:0x0a1a4a, bottom:0xff2a90 },
    fog: 0x0a0a2a, fogNear:40, fogFar:240, sun:0x4adfff, exposure:1.1,
    hemiSky:0x2a4aff, hemiGround:0x1a0a2a,
    top:0x1a2a4a, side:0x101530, accent:0x00ffcc, ground:'roof',
    water:{ deep:0x05052a, shallow:0x0a4a8a },
    grid: true,
  },
  tropic: {
    sky: { top:0x1a3a6a, mid:0xff7a5a, bottom:0xffd23e },
    fog: 0x5a2a4a, fogNear:45, fogFar:260, sun:0xffb05a, exposure:1.1,
    hemiSky:0xff9a7a, hemiGround:0x1a4a3a,
    top:0x2a8a5a, side:0x6a4a2a, accent:0xff4a9a,
    water:{ deep:0x0a3a5a, shallow:0x2ad8c8 },
  },
  edo: {
    sky: { top:0x101a3a, mid:0x4a5a9a, bottom:0xffa64a },
    fog: 0x2a2a4a, fogNear:44, fogFar:250, sun:0xffe8c8, exposure:1.05,
    hemiSky:0x8a9adf, hemiGround:0x4a3a2a,
    top:0x7a6a4a, side:0x4a3a2a, accent:0xff5a6a, ground:'sand',
    water:{ deep:0x0a1a3a, shallow:0x3a6adf },
    moon: true,
  },
};

// kaleidoscope sky for the fractal world (replaces gradient shader)
export function fractalSkyMat(uniforms){
  uniforms.topColor.value.set(0x1a0528); uniforms.midColor.value.set(0x6a1a9a); uniforms.bottomColor.value.set(0xff3a9a);
  return null;
}
