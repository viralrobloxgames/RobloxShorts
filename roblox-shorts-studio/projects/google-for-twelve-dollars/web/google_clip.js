// He Bought Google For 12 Dollars. Web renderer + Roblox R6 pack. True story (Sanmay Ved, 2015): at 1 a.m. a former
// Googler buys google.com for $12 on Google's own domain shop, owns it for a minute, gets cancelled and refunded,
// reports it, is rewarded $6,006.13 (digits spell GOOGLE), gives it to a charity running free schools in India, and
// Google doubles it. Leo is the buyer, Max and Mia are the security team, the Noob brings the cheque.
// Beats: web/beats.js (source/beats.py). Sets, laptop, globe, office, school, cheque: web/kit.js.
// Everything is a pure function of time, so any frame renders on its own.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, packItem } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { W } from './beats.js';
import { bedroom, globe, office, school, cheque, BEDROOM, GLOBE, GLOBE_R, OFFICE, OFFICE_SEAT, SCHOOL } from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 1.5) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'He Bought Google For 12 Dollars' };
export const sky = { zenith: '#4f8fe6', horizon: '#d7ecff', below: '#f0f6ff', fog: '#e8f2ff', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (p) => (Array.isArray(p) ? V(p[0], p[1] || 0, p[2]) : p.clone());
const headTo = (a, b) => Math.atan2(VA(b).x - VA(a).x, VA(b).z - VA(a).z);

// ---------- key times (all on the narration) ----------
const T = {
  hookEnd: W.guy - 0.15, typeA: W.gcom - 0.3, typeB: W.gcom + 0.7, avail: W.available - 0.05, price: W.twelve1 - 0.05,
  click: W.buy + 0.05, paid: W.goes - 0.05, globeIn: W.minute - 0.15, flag: W.owns - 0.1, globeOut: W.inbox - 0.15,
  owner: W.owner - 0.15, cancel: W.cancelled - 0.08, refund: W.refunded - 0.05, wants: W.wants - 0.1,
  report: W.reports - 0.15, sent: W.send - 0.3, press: W.reward - 0.1, noobIn: W.reward - 0.3, squint: W.squint - 0.05,
  give: W.doesnt - 0.05, point: W.asks + 0.1, double: W.doubles - 0.1, count: W.over - 0.1, final: W.twelve4 - 0.45, cta: W.follow - 0.15,
};
T.clock0 = W.minute; T.clock1 = W.cancelled;           // the one-minute countdown runs (sped up) from "minute" to "cancelled"

// ---------- places ----------
const SEAT = V(0, 0, -5.05);                              // Leo at the desk, facing -z
const STAND = V(3.0, 0, -3.4);                            // beside the desk
const DOOR_OUT = V(15, 0, -1.4), NOOB_STOP = V(6.4, 0, -2.6);
const TOP = GLOBE.clone().add(V(0, GLOBE_R, 0));
const KIDS = Array.from({ length: 6 }, (_, i) => ({ from: SCHOOL.clone().add(V((i % 2 ? 1 : -1) * (6 + i * 1.6), 0, 16 + (i % 3) * 3)), delay: i * 0.35 }));
const KID_DOOR = SCHOOL.clone().add(V(0, 0, 0.6));

// ---------- scene ----------
let A = {}, leo, max, mia, noob, kids = [], R, G, O, S, CQ, coin, cam, SHOT = 'hook';
const LEO_FACES = ['neutral', 'happy', 'smug', 'shocked', 'surprised', 'sad', 'laugh', 'determined', 'love', 'cool', 'squeezed', 'confused', 'nervous'];
const SHIRTS = ['#e63946', '#2a9d8f', '#f4a261', '#8338ec', '#3a86ff', '#06d6a0'], PANTS = ['#264653', '#1d3557', '#495057', '#5c4033', '#2b2d42', '#3d405b'];
const SKINS = ['#c68642', '#8d5524', '#e0ac69', '#f1c27d', '#a0663a', '#d29a66'];
export async function setup(stage) {
  const { scene } = stage;
  [leo, max, mia, noob] = await Promise.all([
    loadRobloxCharacter('Leo', { expressions: LEO_FACES, hairLift: 0.16 }),
    loadRobloxCharacter('Max', { expressions: ['neutral', 'surprised', 'happy', 'determined', 'shocked', 'laugh', 'cool'] }),
    loadRobloxCharacter('Mia', { expressions: ['neutral', 'surprised', 'happy', 'determined', 'shocked', 'laugh', 'love'] }),
    loadRobloxCharacter('Noob', { expressions: ['happy', 'neutral', 'surprised', 'laugh'] }),
  ]);
  scene.add(leo.root, max.root, mia.root, noob.root);
  for (let i = 0; i < KIDS.length; i++) {                 // the school children: Noob rigs in their own colours
    const e = await loadRobloxCharacter('Noob', { expressions: ['happy', 'laugh'] });
    e.root.traverse((o) => {
      if (!o.isMesh || o.name === 'Face') return;
      const c = o.name === 'Torso' ? SHIRTS[i] : /Leg/.test(o.name) ? PANTS[i] : SKINS[i];
      o.material = o.material.clone(); o.material.map = null; o.material.color.set(c); o.material.needsUpdate = true;
    });
    e.root.scale.setScalar(0.8); scene.add(e.root); kids.push(e);
  }
  for (const n of ['idle', 'walk', 'sit', 'proud', 'shock', 'defeated', 'point_forward', 'laugh_big', 'clap', 'shrug']) A[n] = await loadAnimation(n);
  R = bedroom(scene); G = globe(scene); O = office(scene); S = school(scene);
  CQ = cheque(); scene.add(CQ.group);
  coin = await packItem('props', 'gold_coin'); coin.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(coin);
}

// ---------- the cast ----------
const base = (pos, heading, face) => ({ pos: VA(pos), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function along(from, to, t0, s, speed) {
  const a = VA(from), b = VA(to), d = a.distanceTo(b), u = clamp((s - t0) * speed / Math.max(d, 1e-3));
  return { pos: a.clone().lerp(b, u), moving: u > 0 && u < 1, done: u >= 1, heading: Math.atan2(b.x - a.x, b.z - a.z), anim: (u * d) / STRIDE };
}
const walkTo = (x, from, to, t0, s, speed, endHeading) => {
  const m = along(from, to, t0, s, speed); x.pos = m.pos;
  if (m.moving) { x.heading = m.heading; x.layers = [['walk', m.anim]]; } else if (m.done) { x.heading = endHeading; x.layers = [['idle', s]]; }
  return m;
};
const typingArms = (s, on) => { const j = on ? 0.09 : 0; return [['L', 0.14, -1.25 + j * Math.sin(s * 23)], ['R', 0.14, -1.25 + j * Math.sin(s * 19 + 1.3)]]; };
const typingNow = (s) => (s > T.hookEnd && s < T.typeB + 0.1) || (s > T.report && s < T.sent);
const ON_GLOBE = (s) => s >= T.globeIn && s < T.globeOut;

function leoAt(s) {
  if (ON_GLOBE(s)) {                                        // he owns the world's most visited website: on top of the world
    const x = base(TOP, 0.25, 'cool'); x.layers = [['proud', s - T.globeIn, 1, false]];
    if (s > T.flag + 0.6) x.face = 'laugh';
    return x;
  }
  if (s < T.owner) {                                        // 1 a.m. at the desk
    const x = base(SEAT, Math.PI, 'neutral'); x.layers = [['sit', 0.5]]; x.y = 0.32; x.arms = typingArms(s, typingNow(s));
    if (s >= T.avail) x.face = 'surprised';
    if (s >= T.price) x.face = 'smug';
    if (s >= T.click - 0.3 && s < T.click + 0.15) x.arms = [['L', 0.14, -1.25], ['R', 0.1, -1.25 - 0.18 * Math.sin(Math.PI * clamp((s - T.click + 0.3) / 0.45))]];
    if (s >= T.paid) x.face = 'shocked';
    if (s >= T.globeOut) { x.face = 'happy'; x.arms = typingArms(s, false); }
    return x;
  }
  if (s < T.report) {                                       // stands up: owner controls, then cancelled
    const x = base(STAND, 0.45, 'cool'); x.layers = [['proud', s - T.owner, 1, false]];
    if (s >= T.cancel) { x.face = 'shocked'; x.layers = [['shock', s - T.cancel, 1, false]]; }
    if (s >= T.refund) { x.face = 'sad'; x.layers = [['idle', s]]; x.coin = true; }
    if (s >= T.wants) { x.face = 'sad'; x.layers = [['defeated', s - T.wants, 1, false]]; x.coin = false; }
    return x;
  }
  if (s < T.noobIn + 1.2) {                                 // writes the report
    const x = base(SEAT, Math.PI, 'determined'); x.layers = [['sit', 0.5]]; x.y = 0.32; x.arms = typingArms(s, typingNow(s));
    if (s >= T.sent) x.face = 'happy';
    if (s >= T.noobIn) { x.face = 'surprised'; x.yaw = 0.9 * smooth(inv(T.noobIn, T.noobIn + 0.4, s)); }
    return x;
  }
  if (s < T.final) {                                        // up to meet the Noob and the cheque
    const x = base(STAND, Math.PI / 2, 'shocked');
    if (s >= W.write - 0.2) x.face = 'squeezed';
    if (s >= W.l1) x.face = 'surprised';
    if (s >= T.give) { x.face = 'happy'; x.arms = [['L', 0.1, -1.3 * smooth(inv(T.give, T.give + 0.3, s))], ['R', 0.1, -1.3 * smooth(inv(T.give, T.give + 0.3, s))]]; }
    if (s >= T.point) { x.arms = []; x.layers = [['point_forward', s - T.point, 1, false]]; x.face = 'love'; x.heading = 0.6; }
    return x;
  }
  const x = base(V(0.8, 0, -2.2), 0.15, 'happy');          // morning: holds the $12 coin up next to the $12,012 screen
  x.arms = [['R', 0.15, -2.2]]; x.coin = 'up';
  if (s >= T.cta - 0.6) x.face = 'laugh';
  return x;
}
function noobAt(s) {
  if (s < T.noobIn || s >= T.final) return { ...base(DOOR_OUT, 0, 'happy'), visible: false };
  const x = base(DOOR_OUT, -Math.PI / 2, 'happy'); x.cheque = true;
  const m = walkTo(x, DOOR_OUT, NOOB_STOP, T.noobIn, s, 12, -Math.PI / 2);
  x.arms = [['L', 0.05, -1.2], ['R', 0.05, -1.2]];
  if (m.done && s >= W.write - 0.2 && s < T.give) x.heading = -Math.PI / 2 + 1.05;        // turns the cheque to the camera
  if (s >= T.give) { x.face = 'surprised'; }
  if (s >= T.point + 0.4) x.face = 'laugh';
  return x;
}
function maxAt(s) {
  const x = base(OFFICE_SEAT.Max, Math.PI, 'neutral'); x.layers = [['sit', 0.9]]; x.y = 0.32; x.arms = typingArms(s, true);
  if (s >= T.press - 0.2) { x.face = 'surprised'; x.yaw = 0.7; x.arms = typingArms(s, false); }
  if (s >= T.press + 0.6) x.face = 'laugh';
  if (s >= T.double - 0.5) { x.pos = OFFICE_SEAT.Max.clone().add(V(0.4, 0, 2.6)); x.y = undefined; x.heading = 0.25; x.layers = [['clap', s - T.double, 1, true]]; x.face = 'happy'; x.arms = []; x.yaw = 0; }
  return x;
}
function miaAt(s) {
  const x = base(OFFICE_SEAT.Mia, Math.PI, 'determined'); x.layers = [['sit', 1.3]]; x.y = 0.32; x.arms = typingArms(s + 0.4, s < T.press - 0.6);
  if (s >= T.press - 0.6) {                                 // reaches over and slams the REWARD button
    const k = smooth(inv(T.press - 0.6, T.press - 0.1, s)) - smooth(inv(T.press + 0.25, T.press + 0.7, s));
    x.arms = [['L', 0.14, -1.25], ['R', 0.15 + 0.5 * k, -1.25 - 0.25 * k]]; x.face = s >= T.press ? 'happy' : 'determined';
  }
  if (s >= T.double - 0.5) { x.pos = OFFICE_SEAT.Mia.clone().add(V(-0.4, 0, 2.6)); x.y = undefined; x.heading = -0.25; x.layers = [['clap', s - T.double + 0.2, 1, true]]; x.face = 'love'; x.arms = []; }
  return x;
}
function kidAt(i, s) {
  const k = KIDS[i], x = base(k.from, Math.PI, 'happy');
  const m = walkTo(x, k.from, KID_DOOR, T.point - 0.4 + k.delay, s, 9, Math.PI);
  x.visible = !m.done; if (i % 2) x.face = 'laugh';
  return x;
}

// ---------- posing ----------
const EUL = new THREE.Euler();
function setArm(a, side, up, fwd = 0.08) { EUL.set(fwd, 0, side === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + side].quaternion.setFromEuler(EUL); }
const HAND = { L: V(0.5, -1.5, 0.15), R: V(-0.5, -1.5, 0.15) };
const handP = (a, side = 'R') => a.bones['Arm.' + side].localToWorld(HAND[side].clone());
function place(a, x) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  const p = VA(x.pos);
  a.root.position.copy(p); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [side, up, fwd] of x.arms) setArm(a, side, up, fwd);
  if (x.yaw) a.bones.Head.rotateY(x.yaw);
  a.root.updateMatrixWorld(true);
  if (x.y !== undefined) a.root.position.y = p.y + x.y; else a.root.position.y -= a.soleHeight() - p.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}

// ---------- the laptop screen ----------
const UI = { bg: '#f6f7fb', ink: '#1d2230', mute: '#7a8194', blue: '#2f6fed', green: '#1e9e55', red: '#e03131' };
function pill(g, x, y, w, h, fill, text, color = '#fff', size = 34) { roundRect(g, x, y, w, h, h / 2); g.fillStyle = fill; g.fill(); if (text) { g.fillStyle = color; g.font = `800 ${size}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x + w / 2, y + h / 2 + 2); } }
function chrome(g, w, h, title, clockText) {           // a plain browser: tab bar, address bar, taskbar clock
  g.fillStyle = UI.bg; g.fillRect(0, 0, w, h);
  g.fillStyle = '#dfe3ec'; g.fillRect(0, 0, w, 64); roundRect(g, 150, 12, 380, 52, 12); g.fillStyle = UI.bg; g.fill();
  g.fillStyle = UI.ink; g.font = '800 24px Montserrat'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(title, 172, 40);
  for (const [i, c] of [['#ff5f57'], ['#febc2e'], ['#28c840']].entries()) { g.fillStyle = c[0]; g.beginPath(); g.arc(30 + i * 30, 36, 9, 0, 7); g.fill(); }
  g.fillStyle = '#1d2230'; g.fillRect(0, h - 46, w, 46); g.fillStyle = '#fff'; g.font = '800 26px Montserrat'; g.textAlign = 'right'; g.fillText(clockText, w - 24, h - 22);
}
function cursor(g, x, y, down) { g.save(); g.translate(x, y); g.scale(down ? 0.9 : 1, down ? 0.9 : 1); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 46); g.lineTo(12, 35); g.lineTo(22, 56); g.lineTo(30, 52); g.lineTo(20, 32); g.lineTo(36, 32); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#000'; g.stroke(); g.restore(); }
function stamp(g, text, x, y, size, color, k, rot = -0.14) {
  if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(1 + 0.6 * (1 - k), 1 + 0.6 * (1 - k)); g.globalAlpha = Math.min(1, k * 1.5);
  g.font = `${size}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; const tw = g.measureText(text).width;
  g.lineWidth = 12; g.strokeStyle = color; roundRect(g, -tw / 2 - 30, -size * 0.75, tw + 60, size * 1.5, 18); g.stroke(); g.fillStyle = color; g.fillText(text, 0, 6); g.restore();
}
function drawScreen(g, w, h, s) {
  const cx = w / 2, clockText = s < T.final ? '1:0' + Math.min(9, Math.floor(Math.max(0, s - 2) / 6)) + ' AM' : '9:41 AM';
  if (s >= T.final) {                                     // morning: the donation, doubled
    chrome(g, w, h, 'donation', clockText);
    g.fillStyle = '#fff4f6'; g.fillRect(0, 64, w, h - 110);
    g.textAlign = 'center'; g.fillStyle = '#e63958'; g.font = '110px "Luckiest Guy"'; g.fillText('♥', cx, 190);
    g.fillStyle = UI.ink; g.font = '800 40px Montserrat'; g.fillText('DONATED TO FREE SCHOOLS', cx, 290);
    g.fillStyle = UI.green; g.font = '96px "Luckiest Guy"'; g.fillText('$12,012.26', cx, 410);
    g.fillStyle = UI.mute; g.font = '800 30px Montserrat'; g.fillText('from a $12 website', cx, 500); return;
  }
  if (s >= T.report && s < T.noobIn + 1.2) {              // the report to the security team
    chrome(g, w, h, 'mail - new message', clockText);
    g.textAlign = 'left'; g.fillStyle = UI.mute; g.font = '800 30px Montserrat';
    g.fillText('To:', 200, 130); g.fillText('Subject:', 200, 190);
    g.fillStyle = UI.ink; g.fillText('Security Team', 360, 130); g.fillText('I just bought google.com', 360, 190);
    g.fillStyle = '#e6e9f0'; g.fillRect(200, 222, 624, 3);
    const body = 'Hi! Your shop sold me google.com for $12. I think that is a bug...', n = Math.floor(clamp((s - T.report - 0.3) / 1.6) * body.length);
    g.fillStyle = UI.ink; g.font = '800 32px Montserrat'; const words = body.slice(0, n); g.fillText(words.slice(0, 32), 200, 280); g.fillText(words.slice(32), 200, 330);
    if (s >= T.sent) { pill(g, 312, 400, 400, 96, UI.green, 'SENT ✓', '#fff', 48); } else pill(g, 412, 400, 200, 80, UI.blue, 'SEND', '#fff', 36);
    return;
  }
  if (s >= T.globeOut && s < T.cancel) {                  // inbox, then the owner controls
    if (s < T.owner - 0.1) {
      chrome(g, w, h, 'mail - inbox', clockText);
      const n = Math.min(9, 1 + Math.floor((s - T.globeOut) / 0.32));
      g.textAlign = 'left';
      for (let i = 0; i < n; i++) {
        const y = 90 + i * 56, k = clamp((s - T.globeOut - i * 0.32) / 0.2);
        g.globalAlpha = k; g.fillStyle = i % 2 ? '#ffffff' : '#eef3ff'; g.fillRect(180, y, 664, 50);
        g.fillStyle = UI.blue; g.beginPath(); g.arc(205, y + 25, 8, 0, 7); g.fill();
        g.fillStyle = UI.ink; g.font = '800 24px Montserrat'; g.fillText('For the owner of google.com', 226, y + 26); g.globalAlpha = 1;
      }
      pill(g, 760, 76, 86, 46, UI.red, String(n * 7 + Math.floor((s - T.globeOut) * 23)), '#fff', 26);
    } else {
      chrome(g, w, h, 'site owner controls', clockText);
      g.textAlign = 'center'; g.fillStyle = UI.ink; g.font = '64px "Luckiest Guy"'; g.fillText('google.com', cx, 150);
      g.fillStyle = UI.green; g.font = '800 30px Montserrat'; g.fillText('✓ VERIFIED OWNER', cx, 210);
      ['Settings', 'Users', 'Messages', 'Search data'].forEach((t, i) => { roundRect(g, 220 + (i % 2) * 300, 250 + Math.floor(i / 2) * 110, 280, 90, 16); g.fillStyle = '#e8eefc'; g.fill(); g.fillStyle = UI.blue; g.font = '800 30px Montserrat'; g.fillText(t, 360 + (i % 2) * 300, 297 + Math.floor(i / 2) * 110); });
    }
    return;
  }
  // the domain shop: search, AVAILABLE $12, BUY, paid; then cancelled and refunded
  chrome(g, w, h, 'Google Domains', clockText);
  g.textAlign = 'center'; g.fillStyle = UI.ink; g.font = '800 34px Montserrat'; g.fillText('Find your website name', cx, 115);
  roundRect(g, 200, 145, 624, 76, 38); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#c9cfdc'; g.stroke();
  const hook = s < T.hookEnd, typed = hook || s >= T.typeB ? 'google.com' : 'google.com'.slice(0, Math.floor(clamp((s - T.typeA) / (T.typeB - T.typeA)) * 10));
  g.textAlign = 'left'; g.fillStyle = UI.ink; g.font = '800 40px Montserrat'; g.fillText(typed, 236, 185);
  if (!hook && s < T.avail && Math.floor(s * 2.5) % 2 === 0) { const tw = g.measureText(typed).width; g.fillRect(240 + tw, 160, 4, 46); }
  const showResult = hook || s >= T.avail;
  if (showResult && s < T.paid) {
    const k = hook ? 1 : easeOutBack(clamp((s - T.avail) / 0.25), 1.6);
    g.save(); g.translate(cx, 330); g.scale(k, k);
    roundRect(g, -312, -80, 624, 160, 20); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 5; g.strokeStyle = UI.green; g.stroke();
    g.textAlign = 'left'; g.fillStyle = UI.ink; g.font = '800 44px Montserrat'; g.fillText('google.com', -280, -30);
    g.fillStyle = UI.green; g.font = '50px "Luckiest Guy"'; g.fillText('AVAILABLE', -280, 38);
    const pk = hook || s >= T.price ? 1 : 0;
    g.textAlign = 'right'; g.fillStyle = pk ? UI.ink : '#c9cfdc'; g.font = '70px "Luckiest Guy"'; g.fillText('$12', 290, -24);
    g.restore();
    const down = s >= T.click - 0.05 && s < T.click + 0.15;
    pill(g, cx - 130, 440, 260, 86, down ? '#155fd0' : UI.blue, 'BUY', '#fff', 48);
    if (!hook && s > T.click - 0.9) { const u = smooth(inv(T.click - 0.9, T.click - 0.1, s)); cursor(g, lerp(820, cx + 40, u), lerp(600, 470, u), down); }
  }
  if (s >= T.paid && s < T.cancel) {
    const k = easeOutBack(clamp((s - T.paid) / 0.25), 1.6);
    g.save(); g.translate(cx, 380); g.scale(k, k); roundRect(g, -312, -140, 624, 280, 24); g.fillStyle = '#e9f8ef'; g.fill(); g.lineWidth = 6; g.strokeStyle = UI.green; g.stroke();
    g.textAlign = 'center'; g.fillStyle = UI.green; g.font = '64px "Luckiest Guy"'; g.fillText('PAYMENT', 0, -60); g.fillText('COMPLETE ✓', 0, 10);
    g.fillStyle = UI.ink; g.font = '800 30px Montserrat'; g.fillText('You now own google.com', 0, 90); g.restore();
  }
  if (s >= T.cancel) {
    g.textAlign = 'center'; g.fillStyle = UI.ink; g.font = '800 44px Montserrat'; g.fillText('google.com', cx, 300);
    stamp(g, 'ORDER CANCELLED', cx, 400, 72, UI.red, clamp((s - T.cancel) / 0.18));
    if (s >= T.refund) { g.fillStyle = UI.green; g.font = '800 40px Montserrat'; g.fillText('$12.00 REFUNDED', cx, 530); }
  }
}

// ---------- the cheque ----------
const DIG = ['6', '0', '0', '6', '1', '3'], LET = ['G', 'O', 'O', 'G', 'L', 'E'];
function drawCheque(g, w, h, s) {
  g.fillStyle = '#eaf6ee'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#1e9e55'; g.lineWidth = 14; g.strokeRect(14, 14, w - 28, h - 28);
  g.fillStyle = '#1d2230'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = '800 40px Montserrat'; g.fillText('SECURITY REWARD', 60, 80);
  g.font = '800 34px Montserrat'; g.fillStyle = '#5a6478'; g.fillText('PAY TO:', 60, 160); g.fillStyle = '#1d2230'; g.font = '64px "Luckiest Guy"'; g.fillText('LEO', 230, 164);
  // the amount, one big cell per character: $ 6 , 0 0 6 . 1 3  ->  G O O G L E
  const xs = [190, 330, 470, 610, 790, 930], y = 370;
  g.font = '160px "Luckiest Guy"'; g.textAlign = 'center';
  g.fillStyle = '#1d2230'; g.fillText('$', 80, y + 10);
  const morph = (i) => clamp((s - W['l' + (i + 1)] + 0.05) / 0.18);
  if (morph(0) < 0.5) { g.fillText(',', 400, y + 40); g.fillText('.', 700, y + 40); }
  DIG.forEach((d, i) => {
    const lit = s >= W['d' + (i + 1)] - 0.05, m = morph(i);
    if (lit) { roundRect(g, xs[i] - 62, y - 92, 124, 184, 18); g.fillStyle = m > 0.5 ? '#ffd23f' : 'rgba(255,210,63,.55)'; g.fill(); }
    g.save(); g.translate(xs[i], y); g.scale(1, Math.abs(Math.cos(Math.PI * m)) || 0.02);
    g.fillStyle = m > 0.5 ? '#2f6fed' : '#1d2230'; g.fillText(m > 0.5 ? LET[i] : d, 0, 10); g.restore();
  });
}

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.hookEnd, 'wide'], [W.types - 0.2, 'pov1'], [W.clicks - 0.15, 'face'], [W.goes - 0.12, 'pov2'], [T.globeIn, 'globe'],
  [T.globeOut, 'pov3'], [T.owner, 'owner'], [W.then - 0.12, 'pov4'], [T.refund - 0.1, 'refund'], [T.report, 'pov5'], [W.send - 0.2, 'office'],
  [W.write - 0.15, 'cheque'], [T.give, 'give'], [W.charity - 0.15, 'school'], [T.double, 'double'], [T.final, 'final'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

// Lighting per place: 'night' bedroom (screen glow), 'space' (globe), 'office', 'day' (school), 'morning' bedroom.
function light(stage, mode) {
  const u = stage.skyMesh.material.uniforms, sc = stage.scene;
  const L = {
    night: { sun: 0.0, hemi: 0.16, hemiC: '#5a6aa8', env: 0.14, fill: 0.1, rim: 0.3, glow: 11, ceil: 0, moon: 40, sky: ['#4f8fe6', '#d7ecff'] },
    space: { sun: 3.4, hemi: 0.12, hemiC: '#6a7ab8', env: 0.15, fill: 0.15, rim: 0.9, glow: 0, ceil: 0, moon: 0, sky: ['#02030c', '#0a1238'] },
    office: { sun: 0.4, hemi: 0.75, hemiC: '#eef4ff', env: 0.6, fill: 0.5, rim: 0.6, glow: 0, ceil: 0, moon: 0, sky: ['#4f8fe6', '#d7ecff'] },
    day: { sun: 3.1, hemi: 0.55, hemiC: '#d9ecff', env: 0.55, fill: 0.7, rim: 1.1, glow: 0, ceil: 0, moon: 0, sky: ['#4f8fe6', '#d7ecff'] },
    morning: { sun: 0.0, hemi: 0.6, hemiC: '#fff4e0', env: 0.55, fill: 0.55, rim: 0.6, glow: 6, ceil: 70, moon: 0, sky: ['#4f8fe6', '#d7ecff'] },
  }[mode];
  stage.sun.intensity = L.sun; stage.hemi.intensity = L.hemi; stage.hemi.color.set(L.hemiC); sc.environmentIntensity = L.env;
  stage.fill.intensity = L.fill; stage.rim.intensity = L.rim; R.glow.intensity = L.glow; R.ceilingLight.intensity = L.ceil; R.moon.intensity = L.moon;
  O.lamp.intensity = mode === 'office' ? 90 : 0;
  u.zenith.value.set(L.sky[0]); u.horizon.value.set(L.sky[1]); u.below.value.set(mode === 'space' ? '#02030c' : '#f0f6ff');
  sc.fog.color.set(mode === 'space' ? '#02030c' : '#e8f2ff'); sc.fog.near = mode === 'space' ? 600 : 90; sc.fog.far = mode === 'space' ? 2000 : 520;
  R.setDay(mode === 'morning');
}
const SHOT_MODE = { globe: 'space', office: 'office', double: 'office', school: 'day', final: 'morning', cta: 'morning' };

export function update(t, stage) {
  const s = t, { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  light(stage, SHOT_MODE[SHOT] || 'night');
  R.setClock(1, SHOT === 'final' || SHOT === 'cta' ? 41 + 8 * 60 : 0);

  // cast
  const lx = leoAt(s); place(leo, lx);
  leo.root.visible = lx.visible !== false && !SHOT.startsWith('pov') && SHOT !== 'hook';      // POV shots: we are Leo
  const nx = noobAt(s); place(noob, nx);
  place(max, maxAt(s)); place(mia, miaAt(s));
  kids.forEach((k, i) => { const x = kidAt(i, s); place(k, x); k.root.scale.setScalar(0.8); });

  // the laptop screen, the office screens, the cheque
  R.laptop.screen.draw((g, w, h) => drawScreen(g, w, h, s));
  O.wall.draw((g, w, h) => {
    g.fillStyle = '#0f1726'; g.fillRect(0, 0, w, h); g.fillStyle = '#34a853'; g.fillRect(0, 0, w, 14);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.font = '84px "Luckiest Guy"'; g.fillText('SECURITY TEAM', w / 2, 110);
    if (s < T.press) { g.fillStyle = '#ffd23f'; g.font = '800 54px Montserrat'; g.fillText('NEW REPORT', w / 2, 260); g.fillStyle = '#fff'; g.font = '800 46px Montserrat'; g.fillText('google.com was sold for $12', w / 2, 350); }
    else if (s < T.double - 0.3) { g.fillStyle = '#34a853'; g.font = '800 54px Montserrat'; g.fillText('REWARD SENT', w / 2, 260); g.fillStyle = '#fff'; g.font = '130px "Luckiest Guy"'; g.fillText('$6,006.13', w / 2, 400); }
    else { g.fillStyle = '#ff7aa2'; g.font = '800 54px Montserrat'; g.fillText('GIVEN TO CHARITY - DOUBLED', w / 2, 260); g.fillStyle = '#fff'; g.font = '130px "Luckiest Guy"'; const k = smooth(inv(T.count, T.count + 1.0, s)); g.fillText('$' + (6006.13 * (1 + k)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), w / 2, 400); }
  });
  for (const [n, mon] of Object.entries(O.monitors)) mon.tex.draw((g, w, h) => {
    g.fillStyle = '#10192b'; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = s < T.press ? '#ffd23f' : '#34a853'; g.font = '800 46px Montserrat'; g.fillText(s < T.press ? 'NEW REPORT' : 'REWARD SENT', w / 2, 110);
    g.fillStyle = '#fff'; g.font = '800 40px Montserrat'; g.fillText('google.com', w / 2, 220); g.fillText('bought for $12', w / 2, 290);
    if (n === 'Mia') { g.fillStyle = '#5a6478'; g.fillRect(80, 360, 640, 24); g.fillStyle = '#34a853'; g.fillRect(80, 360, 640 * clamp((s - T.sent) / 2), 24); }
  });
  CQ.tex.draw((g, w, h) => drawCheque(g, w, h, s));
  // the Noob carries the cheque in both hands
  CQ.group.visible = noob.root.visible && !!nx.cheque;
  if (CQ.group.visible) {
    noob.root.updateMatrixWorld(true);
    const hp = handP(noob, 'L').add(handP(noob, 'R')).multiplyScalar(0.5);
    CQ.group.position.copy(hp).add(V(Math.sin(nx.heading) * 0.35, 0.9, Math.cos(nx.heading) * 0.35)); CQ.group.rotation.set(0, nx.heading, 0);
  }
  // the coin: pops out of the laptop into Leo's hand at "refunded"; held up in the morning
  coin.visible = !!lx.coin && leo.root.visible;
  if (coin.visible) {
    leo.root.updateMatrixWorld(true);
    const hand = handP(leo, 'R');
    if (lx.coin === true) { const k = clamp((s - T.refund) / 0.45), from = R.laptop.screenMesh.getWorldPosition(V()); coin.position.copy(from.lerp(hand, easeOut(k))).add(V(0, 1.6 * Math.sin(Math.PI * k), 0)); }
    else coin.position.copy(hand).add(V(0, 0.75, 0.2));
    if (lx.coin === true) coin.rotation.set(0, s * 9, 0); else coin.rotation.set(0, 0.2 * Math.sin(s * 3), 0); coin.scale.setScalar(1.05);
  }
  // the globe: slow spin, the flag pops in and waves
  G.group.rotation.y = 0;
  G.earth.rotation.y = s * 0.15;
  const fk = easeOutBack(clamp((s - T.flag) / 0.3), 1.8);
  G.flag.visible = fk > 0.01; G.flag.position.set(1.6, GLOBE_R - 0.2, -0.8); G.flag.scale.setScalar(Math.max(0.01, fk)); G.wave(s);
  // doors
  R.door.rotation.y = 1.5 * smooth(inv(T.noobIn - 0.5, T.noobIn + 0.1, s)) * (1 - smooth(inv(W.write - 1.0, W.write - 0.4, s)));
  S.doors.forEach((d, i) => { d.rotation.y = (i ? -1 : 1) * 1.4 * smooth(inv(W.charity - 0.4, W.charity + 0.2, s)); });
  O.button.position.y = 0.42 - 0.18 * (s > T.press - 0.05 && s < T.press + 0.25 ? 1 : 0);

  // ---------- cameras ----------
  const scr = R.laptop.screenMesh, sp = scr.getWorldPosition(V()), sn = V(0, 0, 1).applyQuaternion(scr.getWorldQuaternion(new THREE.Quaternion()));
  const pov = (d, up = 0.2, fov = 60, drift = 0) => look(stage, sp.clone().addScaledVector(sn, d).add(V(drift, up, 0)), sp.clone().add(V(drift * 0.3, up * 0.3, 0)), fov, 12);
  const lp = leo.root.position.clone();
  switch (shot.id) {
    case 'hook': pov(lerp(3.5, 3.3, u), 0.3, 60); break;
    case 'wide': look(stage, V(lerp(5.2, 4.6, u), 6.4, lerp(3.2, 2.4, u)), V(-0.2, 4.0, -6.2), 52); break;                          // over the shoulder, night window, clock
    case 'pov1': pov(lerp(3.5, 3.25, u), 0.3, 60); break;
    case 'face': look(stage, V(1.5, 6.9, -8.8), V(0, 4.6, -4.9), 52); break;                                                         // from behind the laptop: his lit face
    case 'pov2': pov(3.35, 0.3, 60); break;
    case 'globe': { const a = lerp(0.25, 0.75, u), r = lerp(17, 14, u); look(stage, TOP.clone().add(V(1.0 + Math.sin(a) * r, lerp(1.6, 3.0, u), Math.cos(a) * r)), TOP.clone().add(V(1.0, 2.6, 0)), 50, 20); break; }
    case 'pov3': pov(3.35, 0.3, 60); break;
    case 'owner': look(stage, V(lerp(6.2, 5.6, u), 4.8, lerp(6.4, 5.6, u)), V(1.2, 3.8, -4.6), 50); break;
    case 'pov4': pov(lerp(3.4, 3.15, u), 0.3, 60); break;
    case 'refund': look(stage, V(6.4, 4.6, 4.2), V(1.6, 3.9, -4.4), 48); break;
    case 'pov5': pov(3.35, 0.3, 60); break;
    case 'office': look(stage, OFFICE.clone().add(V(lerp(9, 4.5, u), lerp(6.2, 7.8, u), lerp(8, 6.5, u))), OFFICE.clone().add(V(lerp(2.5, 0.0, u), lerp(4.4, 7.0, u), -4.5)), 52, 20); break;
    case 'noob': look(stage, V(-3.5, 5.2, 4.5), V(5.0, 3.8, -2.6), 50); break;
    case 'cheque': { const c = CQ.group.getWorldPosition(V()), d = V(0, 0, 1).applyQuaternion(CQ.group.getWorldQuaternion(new THREE.Quaternion())); look(stage, c.clone().addScaledVector(d, lerp(11, 10.4, u)), c, 50, 12); break; }
    case 'give': look(stage, V(4.4, 5.3, 8.6), V(4.6, 3.9, -3.0), 46); break;
    case 'school': look(stage, SCHOOL.clone().add(V(lerp(4, 0, u), lerp(4.5, 5.5, u), lerp(30, 26, u))), SCHOOL.clone().add(V(0, 5.5, 0)), 52, 30); break;
    case 'double': look(stage, OFFICE.clone().add(V(0, 7.6, lerp(13, 11.5, u))), OFFICE.clone().add(V(0, 6.4, -4)), 56, 20); break;
    case 'final': case 'cta': look(stage, V(lerp(3.4, 2.6, u), 5.0, lerp(7.8, 7.0, u)), lp.clone().add(V(-1.5, 4.6, -1.0)), 48); break;
    default: look(stage, V(5, 6, 6), V(0, 4, -5), 50);
  }
  cam = stage.camera;
}

// ---------- overlay ----------
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#16141f') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
function countdown(g, s, t) {                             // the one minute he owned it (sped up), top left
  if (t < T.clock0 || t > T.cancel + 0.8) return;
  const left = Math.max(0, Math.round(60 * (1 - clamp((t - T.clock0) / (T.clock1 - T.clock0))))), done = left === 0;
  const k = easeOutBack(clamp((t - T.clock0) / 0.25), 1.6);
  g.save(); g.translate(170 * s, 330 * s); g.scale(k, k);
  roundRect(g, -130 * s, -62 * s, 260 * s, 124 * s, 28 * s); g.fillStyle = done ? 'rgba(224,49,49,.95)' : 'rgba(12,16,32,.88)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = done ? '#fff' : '#ffd23f'; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.font = `${76 * s}px "Luckiest Guy"`; g.fillText(`0:${String(left).padStart(2, '0')}`, 0, 6 * s);
  g.restore();
}
export function overlay(g, s, t) {
  countdown(g, s, t);
  if (SHOT === 'hook') bigText(g, s, '1:00 AM', 540, 360, 110, '#ffd23f', easeOutBack(clamp(t / 0.2), 1.8), -0.04);
  if (SHOT === 'cheque' && t > W.squint - 0.05 && t < W.l1 + 0.2) {   // squint: eyelids close in from top and bottom
    const k = smooth(inv(W.squint - 0.05, W.squint + 0.3, t)) * (1 - smooth(inv(W.l1 - 0.1, W.l1 + 0.2, t))), lid = 640 * k;
    g.fillStyle = '#0b0b10'; g.fillRect(0, 0, 1080 * s, lid * s); g.fillRect(0, (1920 - lid) * s, 1080 * s, lid * s);
  }
  if (SHOT === 'cheque' && t > W.l6 + 0.15) bigText(g, s, 'GOOGLE!', 540, 1450, 150, '#ffd23f', easeOutBack(clamp((t - W.l6 - 0.15) / 0.2), 2), -0.05);
  if (SHOT === 'double' && t > T.count) bigText(g, s, 'x2', 860, 1180, 170, '#ff7aa2', easeOutBack(clamp((t - T.count) / 0.2), 2), 0.1);
  if (SHOT === 'final' && t > T.final + 0.3) bigText(g, s, '$12  →  $12,012', 540, 380, 104, '#7CFC9A', easeOutBack(clamp((t - T.final - 0.3) / 0.25), 1.8), -0.03);
  if (t >= T.cta) {                                       // call to action
    const k2 = easeOutBack(clamp((t - T.cta) / 0.3), 1.6);
    g.save(); g.translate(540 * s, 440 * s); g.scale(k2, k2);
    roundRect(g, -440 * s, -170 * s, 880 * s, 340 * s, 36 * s); g.fillStyle = 'rgba(12,16,32,.92)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${60 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('MORE STORIES LIKE THIS', 0, -100 * s);
    g.font = `800 ${46 * s}px Montserrat`; g.fillStyle = '#ffd23f'; g.fillText('@viralrobloxgames', 0, -26 * s);
    roundRect(g, -170 * s, 50 * s, 340 * s, 84 * s, 20 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${52 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('FOLLOW', 0, 95 * s);
    g.restore();
  }
}

export const cast = () => ({ leo, max, mia, noob, R, G, O, S, CQ, coin });
export const TIMES = T;
