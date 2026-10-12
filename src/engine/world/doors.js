/** Door behaviour: opening, waiting, closing, re-opening when blocked. */

/** The tiles of a door that move together (a wide doorway is several door tiles). */
const tilesOf = (door) => door.group ?? [door];

/** Something standing in any tile of the door? */
const occupied = (world, door) => tilesOf(door).some((d) => world.tileOccupied(d.x, d.y));

/** Start opening a door (all its tiles). Returns true if it started moving. */
export function openDoor(world, door) {
  if (door.state === 'opening' || door.state === 'open') {
    if (door.state === 'open') for (const d of tilesOf(door)) d.timer = d.wait;
    return false;
  }
  for (const d of tilesOf(door)) d.state = 'opening';
  world.playSoundAt(door.sounds.open ?? 'door-open', door.x + 0.5, door.y + 0.5);
  return true;
}

export function closeDoor(world, door) {
  if (door.state === 'closed' || door.state === 'closing') return false;
  if (occupied(world, door)) return false;
  for (const d of tilesOf(door)) d.state = 'closing';
  world.playSoundAt(door.sounds.close ?? 'door-close', door.x + 0.5, door.y + 0.5);
  return true;
}

export function updateDoors(world, dt) {
  const map = world.map;
  for (const d of map.doors) {
    switch (d.state) {
      case 'opening':
        d.open += d.speed * dt;
        if (d.open >= 1) {
          d.open = 1;
          d.state = 'open';
          d.timer = d.wait;
        }
        break;
      case 'open':
        if (d.stayOpen) break;
        d.timer -= dt;
        if (d.timer <= 0) {
          if (occupied(world, d)) d.timer = 0.5;
          else closeDoor(world, d);
        }
        break;
      case 'closing':
        if (occupied(world, d)) {
          for (const t of tilesOf(d)) t.state = 'opening';
          world.playSoundAt(d.sounds.open ?? 'door-open', d.x + 0.5, d.y + 0.5);
          break;
        }
        d.open -= d.speed * dt;
        if (d.open <= 0) {
          d.open = 0;
          d.state = 'closed';
        }
        break;
      default:
        break;
    }
    if (d.style === 'rise') {
      // The door is the tile's ceiling: it rises from the floor to openZ.
      const i = d.y * map.w + d.x;
      map.ceilZ[i] = map.floorZ[i] + d.open * (d.openZ - map.floorZ[i]);
    }
  }
}
