/**
 * systems/InputSystem.js — Birleşik girdi yönetimi
 * Klavye + Fare + Dokunmatik tek sistemde
 * v1.00
 */

'use strict';
import { Bus, EVENTS, CONSTANTS } from '../core/Engine.js';

class InputSystem {
  constructor() {
    // Tuş durumları
    this.keys = {
      up: false, down: false, left: false, right: false,
      shift: false, q: false, f: false, r: false, e: false,
    };

    // Fare
    this.mouse = { x: 0, y: 0, down: false };

    // Joystick
    this.joy = {
      active: false,
      id:     -1,
      ox: 0, oy: 0,       // merkez koordinat
      dx: 0, dz: 0,       // normalize yön
      angle: 0,
      magnitude: 0,
    };

    this._listeners = [];  // temizlemek için
  }

  // ─── BAŞLAT ────────────────────────────────────────────────
  init(canvas) {
    this._canvas = canvas;
    this._bindKeyboard();
    this._bindMouse(canvas);
    this._bindTouch(canvas);
  }

  // ─── KLAVYE ────────────────────────────────────────────────
  _bindKeyboard() {
    const onDown = e => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup':    this.keys.up    = true; break;
        case 's': case 'arrowdown':  this.keys.down  = true; break;
        case 'a': case 'arrowleft':  this.keys.left  = true; break;
        case 'd': case 'arrowright': this.keys.right = true; break;
        case 'shift':                this.keys.shift = true; break;
        case 'q':                    this.keys.q = true; Bus.emit('input:ability', { key: 'q' }); break;
        case 'f':                    this.keys.f = true; Bus.emit('input:ability', { key: 'f' }); break;
        case 'r':                    this.keys.r = true; Bus.emit('input:ability', { key: 'r' }); break;
        case 'e':                    this.keys.e = true; Bus.emit('input:interact'); break;
        case 'escape': case 'p':     Bus.emit('input:pause'); break;
      }
    };
    const onUp = e => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup':    this.keys.up    = false; break;
        case 's': case 'arrowdown':  this.keys.down  = false; break;
        case 'a': case 'arrowleft':  this.keys.left  = false; break;
        case 'd': case 'arrowright': this.keys.right = false; break;
        case 'shift':                this.keys.shift = false; break;
        case 'q': this.keys.q = false; break;
        case 'f': this.keys.f = false; break;
        case 'r': this.keys.r = false; break;
        case 'e': this.keys.e = false; break;
      }
    };
    document.addEventListener('keydown', onDown);
    document.addEventListener('keyup',   onUp);
    this._listeners.push(
      () => document.removeEventListener('keydown', onDown),
      () => document.removeEventListener('keyup',   onUp),
    );
  }

  // ─── FARE ──────────────────────────────────────────────────
  _bindMouse(canvas) {
    const onMove  = e => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; };
    const onDown  = e => { this.mouse.down = true;  Bus.emit('input:attack', { charged: false }); };
    const onUp    = e => { this.mouse.down = false; Bus.emit('input:attackEnd'); };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mouseup',   onUp);
    this._listeners.push(
      () => canvas.removeEventListener('mousemove', onMove),
      () => canvas.removeEventListener('mousedown', onDown),
      () => canvas.removeEventListener('mouseup',   onUp),
    );
  }

  // ─── DOKUNMATIK ────────────────────────────────────────────
  _bindTouch(canvas) {
    // Dokunmatik olaylar UI katmanından da tetiklenebilir,
    // bu yüzden document'e bağlanıyor
    const onMove   = e => { e.preventDefault(); this._handleJoyMove(e); };
    const onEnd    = e => { this._handleJoyEnd(e); };
    const onCancel = e => { this._handleJoyEnd(e); };

    document.addEventListener('touchmove',   onMove,   { passive: false });
    document.addEventListener('touchend',    onEnd);
    document.addEventListener('touchcancel', onCancel);
    this._listeners.push(
      () => document.removeEventListener('touchmove',   onMove),
      () => document.removeEventListener('touchend',    onEnd),
      () => document.removeEventListener('touchcancel', onCancel),
    );
  }

  // Joystick başlatma (UI'dan çağrılır)
  startJoy(clientX, clientY, touchId, centerX, centerY) {
    this.joy.active = true;
    this.joy.id     = touchId;
    this.joy.ox     = centerX;
    this.joy.oy     = centerY;
    this._computeJoy(clientX, clientY);
  }

  _handleJoyMove(e) {
    if (!this.joy.active) return;
    for (const t of e.changedTouches) {
      if (t.identifier === this.joy.id) {
        this._computeJoy(t.clientX, t.clientY);
        break;
      }
    }
  }

  _handleJoyEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this.joy.id) {
        this._resetJoy();
        break;
      }
    }
  }

  _computeJoy(cx, cy) {
    const dx   = cx - this.joy.ox;
    const dy   = cy - this.joy.oy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const mag  = Math.min(dist, CONSTANTS.JOY_MAX) / CONSTANTS.JOY_MAX;
    const ang  = Math.atan2(dy, dx);

    this.joy.angle     = ang;
    this.joy.magnitude = mag;
    this.joy.dx        = Math.cos(ang) * mag;
    this.joy.dz        = Math.sin(ang) * mag;

    const dead = CONSTANTS.JOY_DEAD / CONSTANTS.JOY_MAX;
    this.keys.up    = this.joy.dz < -dead;
    this.keys.down  = this.joy.dz >  dead;
    this.keys.left  = this.joy.dx < -dead;
    this.keys.right = this.joy.dx >  dead;

    // Joystick piksel offset → UI için
    Bus.emit('input:joyMove', {
      nx: Math.cos(ang) * Math.min(dist, CONSTANTS.JOY_MAX),
      ny: Math.sin(ang) * Math.min(dist, CONSTANTS.JOY_MAX),
    });
  }

  _resetJoy() {
    this.joy.active    = false;
    this.joy.id        = -1;
    this.joy.dx        = 0;
    this.joy.dz        = 0;
    this.joy.magnitude = 0;
    this.keys.up = this.keys.down = this.keys.left = this.keys.right = false;
    Bus.emit('input:joyMove', { nx: 0, ny: 0 });
  }

  // ─── HAREKET VEKTÖRÜ ───────────────────────────────────────
  // Normalize edilmiş hareket yönü döndürür {dx, dz}
  getMovement() {
    let dx = 0, dz = 0;
    if (this.joy.active) {
      dx = this.joy.dx;
      dz = this.joy.dz;
    } else {
      if (this.keys.up)    dz = -1;
      if (this.keys.down)  dz =  1;
      if (this.keys.left)  dx = -1;
      if (this.keys.right) dx =  1;
      const len = Math.hypot(dx, dz);
      if (len > 0) { dx /= len; dz /= len; }
    }
    return { dx, dz };
  }

  // Aim için joystick yönü (dünya koordinatında)
  getJoyAimDir() {
    if (!this.joy.active || this.joy.magnitude < 0.2) return null;
    return { dx: this.joy.dx, dz: this.joy.dz };
  }

  // ─── TEMİZLE ───────────────────────────────────────────────
  destroy() {
    this._listeners.forEach(fn => fn());
    this._listeners = [];
  }
}

export const Input = new InputSystem();
