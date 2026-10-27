// Interaction registry: anything with { id, prompt, pos, radius } can be used with E.
export class Interactions {
  constructor(list, handlers) { this.list = list; this.handlers = handlers; this.current = null; }
  register(item) { this.list.push(item); }
  on(id, fn) { this.handlers[id] = fn; }
  update(playerPos, playerFacing) {
    let best = null, bd = Infinity;
    for (const it of this.list) {
      const dx = it.pos.x - playerPos.x, dz = it.pos.z - playerPos.z;
      const d = Math.hypot(dx, dz);
      if (d < it.radius && d < bd) { best = it; bd = d; }
    }
    this.current = best;
    return best;
  }
  use() { if (this.current && this.handlers[this.current.id]) this.handlers[this.current.id](this.current); }
}
