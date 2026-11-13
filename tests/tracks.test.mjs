import './browser-stubs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { TrackMarks } from '../src/tracks.js';
import { Car } from '../src/car.js';
import { makeRoute } from '../src/stage.js';
import { slopedTerrain } from './road-physics.test.mjs';

function setup(surface) {
  const terrain = slopedTerrain({ size: 2400, grid: 601, grade: 0 });
  const route = makeRoute([{ x: 0, z: -1100 }, { x: 0, z: 1100 }], terrain, { roadWidth: 3.2, surface });
  terrain.carveRoad(route.samples, { halfWidth: route.roadWidth + 1.2 });
  route.snapToTerrain();
  const scene = { children: [], add(o) { this.children.push(o); }, remove(o) { this.children = this.children.filter((c) => c !== o); } };
  const car = new Car(scene, terrain, 'porsche');
  car.setRoute(route);
  const tracks = new TrackMarks(scene, car);
  return { car, tracks, scene };
}

test('gravel leaves ruts under all four wheels, asphalt stays clean unless sliding', () => {
  const gravel = setup('gravel');
  const drive = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  for (let i = 0; i < 60 * 6; i++) { gravel.car.update(1 / 60, drive); gravel.tracks.update(); }
  assert.ok(gravel.tracks.laid > 100, `gravel laid ${gravel.tracks.laid} marks`);
  const pos = gravel.tracks.mesh.geometry.attributes.position;
  const y = pos.getY(0);
  assert.ok(y > gravel.car.groundAt(pos.getX(0), pos.getZ(0)) - 0.5 && y < gravel.car.groundAt(pos.getX(0), pos.getZ(0)) + 0.5, 'marks lie on the ground');

  const tarmac = setup('asphalt');
  for (let i = 0; i < 60 * 6; i++) { tarmac.car.update(1 / 60, drive); tarmac.tracks.update(); }
  assert.equal(tarmac.tracks.laid, 0, 'no marks on clean asphalt');
  const slide = { throttle: 0.5, brake: 0, steer: 1, handbrake: true, jump: false };
  for (let i = 0; i < 60 * 1.5; i++) { tarmac.car.update(1 / 60, slide); tarmac.tracks.update(); }
  assert.ok(tarmac.tracks.laid > 0, 'rubber while sliding on asphalt');
});

test('the ring buffer wraps instead of growing', () => {
  const { car, tracks } = setup('gravel');
  const drive = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  for (let i = 0; i < 60 * 60; i++) { car.update(1 / 60, drive); tracks.update(); if (!car.terrain.inside(car.pos.x, car.pos.z, 10)) break; }
  assert.equal(tracks.mesh.geometry.attributes.position.count, 700 * 4 * 4);
  assert.ok(tracks.state[0].next < 700);
});

test('track quads face upward', () => {
  const { car, tracks } = setup('gravel');
  const drive = { throttle: 1, brake: 0, steer: 0, handbrake: false, jump: false };
  for (let i = 0; i < 60 * 3; i++) { car.update(1 / 60, drive); tracks.update(); }
  const p = tracks.mesh.geometry.attributes.position;
  const idx = tracks.mesh.geometry.index.array;
  const a = [p.getX(idx[0]), p.getY(idx[0]), p.getZ(idx[0])];
  const b = [p.getX(idx[1]), p.getY(idx[1]), p.getZ(idx[1])];
  const c = [p.getX(idx[2]), p.getY(idx[2]), p.getZ(idx[2])];
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const ny = ab[2] * ac[0] - ab[0] * ac[2]; // y component of ab × ac
  assert.ok(ny > 0, `first triangle normal y = ${ny}`);
});
