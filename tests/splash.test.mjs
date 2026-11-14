import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { TrackMarks } from '../src/tracks.js';
import { Car } from '../src/car.js';
import { makeRoute } from '../src/stage.js';
import { slopedTerrain } from './road-physics.test.mjs';

/** A flat gravel road with water over the ground past z = 0: `depth` metres deep. */
function setup(depth) {
  const terrain = slopedTerrain({ size: 2400, grid: 601, grade: 0 });
  terrain.waterAt = (x, z) => (z > 0 ? { depth, surface: terrain.sample(x, z) + depth } : { depth: 0, surface: terrain.sample(x, z) });
  const route = makeRoute([{ x: 0, z: -600 }, { x: 0, z: 600 }], terrain, { roadWidth: 3.2, surface: 'gravel' });
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2 });
  route.snapToTerrain();
  const scene = { children: [], add(o) { this.children.push(o); }, remove(o) { this.children = this.children.filter((c) => c !== o); } };
  const car = new Car(scene, terrain, 'porsche');
  car.setRoute(route);
  const tracks = new TrackMarks(scene, car);
  return { car, tracks };
}

const drive = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
const alive = (sys) => sys.particles.filter((p) => p.life > 0).length;

test('hitting water throws a splash, slows the car and leaves a foam wake', () => {
  const { car, tracks } = setup(0.4);
  while (car.pos.z < -5) { car.update(1 / 60, drive); tracks.update(); }
  const entrySpeed = car.speed;
  assert.ok(entrySpeed > 20, `arrives fast (${entrySpeed.toFixed(1)} m/s)`);
  assert.equal(alive(car.spray), 0, 'dry road: no spray');

  let splash = 0;
  let peakSpray = 0;
  const laidBefore = tracks.laid;
  for (let i = 0; i < 60; i++) {
    const state = car.update(1 / 60, drive);
    tracks.update();
    splash = Math.max(splash, state.splash);
    peakSpray = Math.max(peakSpray, alive(car.spray));
  }
  assert.ok(splash > 0.3, `entry splash strength ${splash.toFixed(2)}`);
  assert.ok(peakSpray > 100, `spray particles ${peakSpray}`);
  assert.ok(car.waterDepth > 0.3, 'the car knows it is in water');
  assert.ok(car.speed < entrySpeed * 0.75, `water drag: ${entrySpeed.toFixed(1)} → ${car.speed.toFixed(1)} m/s in 1 s`);
  assert.ok(tracks.laid > laidBefore + 10, 'wake marks were laid');
  // The wake sits on the water line, not on the bed.
  const pos = tracks.mesh.geometry.attributes.position;
  const colors = tracks.mesh.geometry.attributes.color;
  const last = (tracks.state[0].next - 1 + 700) % 700;
  const v = last * 4;
  assert.ok(pos.getY(v) >= car.waterSurface - 0.01, 'wake quad on the water surface');
  assert.ok(pos.getY(v) > car.terrain.sample(pos.getX(v), pos.getZ(v)) + 0.3, 'wake quad above the bed');
  assert.ok(colors.getY(v) > 0.8 && colors.getZ(v) > 0.8, 'wake is pale foam');
});

test('deep water kills the engine and the car is fished out onto dry ground', () => {
  const { car } = setup(2.0);
  while (car.pos.z < -5) car.update(1 / 60, drive);
  let recovered = false;
  for (let i = 0; i < 60 * 5 && !recovered; i++) recovered = car.update(1 / 60, drive).recovered;
  assert.ok(recovered, 'recovered within five seconds');
  assert.ok(car.pos.z < 0, `back on dry ground (z = ${car.pos.z.toFixed(1)})`);
  assert.equal(car.waterDepth, 0);
  assert.equal(car.speed, 0);
});

test('flying over water is dry until the car comes down onto it', () => {
  const { car } = setup(0.4);
  while (car.pos.z < -5) car.update(1 / 60, drive);
  car.reset({ x: 0, z: 40, yaw: 0 });
  car.pos.y += 6;
  car.grounded = false;
  car.verticalVel = 0;
  let splashWhileAirborne = 0;
  let splashOnLanding = 0;
  for (let i = 0; i < 120; i++) {
    const state = car.update(1 / 60, drive);
    if (!car.grounded && state.splash) splashWhileAirborne = state.splash;
    if (car.grounded) splashOnLanding = Math.max(splashOnLanding, state.splash);
  }
  assert.equal(splashWhileAirborne, 0, 'no splash in the air');
  assert.ok(splashOnLanding > 0, 'splash when the car hits the water');
});
