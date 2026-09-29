/**
 * NWIS — Telemetry Simulator
 * 
 * Realistic drilling telemetry simulator using Socket.IO.
 * Creates deterministic progression from NORMAL → WARNING → RISK
 * as depth approaches historical incident zones.
 * 
 * NOT random values — parameters have realistic relationships.
 */

class TelemetrySimulator {
  constructor(io, options = {}) {
    this.io = io;
    this.running = false;
    this.interval = null;
    this.tickRate = options.tickRate || 2000; // ms between updates

    // Current state
    this.state = 'NORMAL';
    this.tick = 0;

    // Drilling parameters
    this.depth = options.startDepth || 2980;
    this.torque = 350;       // Nm
    this.rpm = 120;          // RPM
    this.pumpPressure = 2800; // psi
    this.mudWeight = 11.5;   // PPG
    this.rop = 12;           // m/hr
    this.wob = 15;           // kN
    this.flowRate = 2400;    // L/min

    // Target well info (for risk zone detection)
    this.wellId = options.wellId || null;
    this.targetDepth = options.targetDepth || 3500;

    // Risk zones (historical incident depths/formations)
    this.riskZones = options.riskZones || [
      { depth: 3040, range: 60, type: 'Stuck Pipe', formation: 'Barail' },
    ];

    // Noise generators with smooth transitions
    this._smoothNoise = {
      torque: 0,
      rpm: 0,
      pressure: 0,
      rop: 0,
      wob: 0,
      flow: 0,
    };

    // Periodic oscillation phase (simulates rotary/pump cycles)
    this._phase = Math.random() * Math.PI * 2;

    // Risk alert callback
    this.onRiskAlert = options.onRiskAlert || null;
    this._lastAlertDepth = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.state = 'NORMAL';
    console.log('[Telemetry] Simulator started');

    this.interval = setInterval(() => {
      this._tick();
    }, this.tickRate);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    clearInterval(this.interval);
    this.interval = null;
    console.log('[Telemetry] Simulator stopped');
  }

  reset(options = {}) {
    this.stop();
    this.tick = 0;
    this.depth = options.startDepth || 2980;
    this.torque = 350;
    this.rpm = 120;
    this.pumpPressure = 2800;
    this.mudWeight = 11.5;
    this.rop = 12;
    this.wob = 15;
    this.flowRate = 2400;
    this.state = 'NORMAL';
    this._lastAlertDepth = 0;
    console.log('[Telemetry] Simulator reset');
  }

  getStatus() {
    return {
      running: this.running,
      state: this.state,
      tick: this.tick,
      depth: this.depth,
    };
  }

  getCurrentData() {
    return {
      depth: Math.round(this.depth * 10) / 10,
      torque: Math.round(this.torque * 10) / 10,
      rpm: Math.round(this.rpm * 10) / 10,
      pumpPressure: Math.round(this.pumpPressure * 10) / 10,
      mudWeight: Math.round(this.mudWeight * 100) / 100,
      rop: Math.round(this.rop * 100) / 100,
      wob: Math.round(this.wob * 10) / 10,
      flowRate: Math.round(this.flowRate),
      state: this.state,
      timestamp: new Date().toISOString(),
      tick: this.tick,
    };
  }

  setRiskZones(zones) {
    this.riskZones = zones;
  }

  _tick() {
    this.tick++;

    // Calculate proximity to nearest risk zone
    let closestRisk = null;
    let minProximity = Infinity;

    for (const zone of this.riskZones) {
      const dist = Math.abs(this.depth - zone.depth);
      if (dist < minProximity) {
        minProximity = dist;
        closestRisk = zone;
      }
    }

    const riskRange = closestRisk ? closestRisk.range : 100;
    const riskFactor = closestRisk
      ? Math.max(0, 1 - minProximity / riskRange)
      : 0;

    // Update state based on risk factor
    if (riskFactor > 0.7) {
      this.state = 'RISK';
    } else if (riskFactor > 0.3) {
      this.state = 'WARNING';
    } else {
      this.state = 'NORMAL';
    }

    // Advance oscillation phase (simulates rotary/pump cycles)
    this._phase += 0.15 + Math.random() * 0.1;
    const cyclic = Math.sin(this._phase);
    const cyclic2 = Math.cos(this._phase * 0.7);

    // ── DEPTH ──────────────────────────────────────────────
    const baseROP = 12 - riskFactor * 8;
    this.rop = baseROP + this._smooth('rop', 5) + cyclic * 1.5;
    this.rop = Math.max(0.5, this.rop);

    const depthIncrement = (this.rop / 3600) * (this.tickRate / 1000);
    this.depth += depthIncrement;

    if (this.depth >= this.targetDepth) {
      this.depth = this.targetDepth;
      this.rop = 0;
    }

    // ── TORQUE ─────────────────────────────────────────────
    const baseTorque = 320 + (this.depth - 2980) * 0.5;
    const riskTorque = riskFactor * 180;
    // Large noise + cyclic vibration pattern
    this.torque = baseTorque + riskTorque + this._smooth('torque', 40) + cyclic * 20 + cyclic2 * 12;
    this.torque = Math.max(200, this.torque);

    // ── RPM ────────────────────────────────────────────────
    const baseRPM = 120 - riskFactor * 40;
    this.rpm = baseRPM + this._smooth('rpm', 15) + cyclic2 * 8;
    this.rpm = Math.max(40, Math.min(160, this.rpm));

    // ── PUMP PRESSURE ──────────────────────────────────────
    const basePressure = 2700 + (this.depth - 2980) * 2;
    const riskPressure = riskFactor * 500;
    this.pumpPressure = basePressure + riskPressure + this._smooth('pressure', 120) + cyclic * 60 + cyclic2 * 35;
    this.pumpPressure = Math.max(2000, this.pumpPressure);

    // ── MUD WEIGHT ─────────────────────────────────────────
    const baseMW = 11.5 + (this.depth - 2980) * 0.001;
    this.mudWeight = baseMW + riskFactor * 0.5 + this._smooth('rop', 0.15) + cyclic * 0.08;
    this.mudWeight = Math.max(9.0, Math.min(14.0, this.mudWeight));

    // ── WOB ────────────────────────────────────────────────
    this.wob = 15 + riskFactor * 8 + this._smooth('wob', 4) + cyclic2 * 2;
    this.wob = Math.max(5, Math.min(30, this.wob));

    // ── FLOW RATE ──────────────────────────────────────────
    this.flowRate = 2400 - riskFactor * 200 + this._smooth('flow', 80) + cyclic * 40;
    this.flowRate = Math.max(1800, Math.min(3000, this.flowRate));

    // Emit telemetry data
    const data = this.getCurrentData();
    this.io.emit('telemetry:update', data);

    // Check for risk alert
    if (this.state === 'RISK' && closestRisk && Math.abs(this.depth - this._lastAlertDepth) > 5) {
      this._lastAlertDepth = this.depth;
      const alertData = {
        type: closestRisk.type,
        formation: closestRisk.formation,
        depth: Math.round(this.depth * 10) / 10,
        riskFactor: Math.round(riskFactor * 100) / 100,
        state: this.state,
        telemetry: data,
        timestamp: new Date().toISOString(),
      };
      this.io.emit('risk:alert', alertData);

      if (this.onRiskAlert) {
        this.onRiskAlert(alertData);
      }
    }

    // Emit status
    this.io.emit('telemetry:status', {
      running: this.running,
      state: this.state,
      depth: Math.round(this.depth * 10) / 10,
      tick: this.tick,
    });
  }

  /**
   * Smooth noise generator — creates gradual parameter changes
   * instead of random jumps. Uses random walk with mean reversion.
   */
  _smooth(key, scale) {
    const current = this._smoothNoise[key] || 0;
    const target = (Math.random() - 0.5) * scale;
    // Mean-reverting random walk
    this._smoothNoise[key] = current * 0.85 + target * 0.15;
    return this._smoothNoise[key];
  }
}

module.exports = TelemetrySimulator;
