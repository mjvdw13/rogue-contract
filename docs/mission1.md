# Mission 1: the Canyon Garrison (design)

The first real level (PLAN.md Phase 1b B, then Phase 4). An original
mercenary, hired by the Rebellion, breaks into an Imperial garrison dug into
a desert canyon at night. The objectives and the briefing (Phase 2) don't
exist yet, so for now the level runs from the canyon to an exit switch on a
landing pad's pickup spot. The red keycard and a generator switch gate the way.

## Grid and building

- Fine grid: 1 tile = 0.5 m. The player is 1.7 tall and 1 wide, with the eye
  at 1. Steps go up to 0.8, jumps up to about 1.56, crouch spaces are 1.2
  high, and running jumps clear gaps of up to 4 tiles.
- The map is 128 x 100 tiles. Everything not painted is canyon rock.
- **Built in code, not typed as ASCII.** `src/content/levels/m1.js` paints
  areas with a small painter (`src/content/levels/lib/painter.js`): rooms,
  corridors, chamfered corners, lifts and doors, each cell carrying its own
  floor, ceiling, heights and light. The painter dedupes the cells into
  legend glyphs and returns the usual `tiles` and `legend`. Things go in
  `list` at exact positions. The validator, map viewer and game see an
  ordinary level.

## Route

canyon (0) → crouch vent (0.5) → maintenance (0) → lift L1 to 6 → barracks
corridor (6) → officer's office (red keycard) → red door → data vault (6) →
generator catwalks (6) → lift L2 down to the generator floor (-6) → overload
switch (opens the escape hatch) → back up → escape hatch → gantry stairs
(6 → 8) → jump the 3-tile chasm → landing pad (8) → the marked pickup spot (exit).

## Areas (x, y in tiles; heights in units)

| # | Area | Box (x0..x1, y0..y1) | Floor / ceiling | Notes |
|---|------|----------------------|-----------------|-------|
| 1 | Start bowl | 6..30, 76..96 | 0 / sky 24 | Start (14.5, 90.5) facing north. Secret alcove behind a rock door in the west wall (2..6, 80..84): a shield unit. |
| 2 | Gorge | 14..34, 60..76 | 0 / sky | Winds north-east, with angled rock walls. |
| 3 | The bowl | 20..60, 44..60 | 0 / sky | Landmark: a rock spire (chamfered 6x6 block at 35..41, 49..55). Sniper ledge A (west, 20..24, floor 5) can't be reached. Ledge B (east, 56..60, floor 5) is reached by rock steps at its south end. |
| 4 | Garrison face | 26..70, 36..40 | wall | Imperial wall facing the canyon, with a locked main gate (44..52) between light strips. The vent mouth is at 32..34. |
| 5 | Vent | 32..34, 26..40 | 0.5 / 1.7 | Crouch only (1.2 clear). |
| 6 | Maintenance | 26..42, 14..26 | 0 / 5 | Dim, grate floor, with a lit panel in the middle. Crates, a console, an ambush trooper. |
| 7 | Lift L1 shaft | 42..46, 16..20 | lift 0 → 6 / 12 | Opens west at 0 and east at 6. |
| 8 | Barracks corridor | 46..76, 16..20 | 6 / 10 | Light strips, hanging lamps. A trooper. |
| 9 | Bunk room | 48..60, 4..14 | 6 / 10 | Door 52..55 x 14..16. Troopers, crates for bunks, a med kit. |
| 10 | Officer's office | 62..72, 4..14 | 6 / 9 | Door 65..68 x 14..16. An officer, the **red keycard**, a console. |
| 11 | Red door | 76..78, 16..20 | 6 | Into the vault. |
| 12 | Data vault | 78..92, 10..24 | 6 / 9 | Dark (light 96), computer-bank walls, chamfered corners, ammo. Secret niche (92..96, 14..18) behind a computer-bank door: a shield. South door 83..87 x 24..26 onto the generator catwalk. |
| 13 | Generator chamber | 72..108, 26..62 | -6 / 18 | Catwalk ring at 6 (3 wide). Central reactor column (86..94, 40..48) with chamfered corners. North and south bridges (88..92) join the ring to the column; they reach down to the floor, splitting the bottom into west and east halves. Lifts L2 (75..79, 55..59, west) and L2b (101..105, 29..33, east) run -6 ↔ 6. The overload switch is on the column's south face at the bottom: it opens `escape`, dims the chamber and shows a message. Probe droid, troopers, fuel barrels at the bottom. |
| 14 | Escape hatch | 108..110, 42..46 | 6 | Remote-locked door, tag `escape`. |
| 15 | Gantry | 110..118, 42..46 | 6 → 8 / sky | Stairs up 0.5 per tile to 8. |
| 16 | Chasm | 118..121, 34..58 | -2 / sky | The 3-tile jump. Lift L3 (118..121, 54..58) runs back up (-2 ↔ 8) if you fall. |
| 17 | Landing pad | 121..126, 34..58 | 8 / sky | Troopers. The exit is the marked pickup spot on the pad (122..126, 43..47). |

## Secrets (3)

1. The start bowl's rock alcove (shield unit).
2. The vault's computer-bank niche (shield unit).
3. Ledge B in the bowl. It's reachable but tucked away, so it's marked secret
   (energy pack, and a view down on the gate).

## Enemies by skill

Snipers on both ledges, two gate guards, a probe droid in the bowl (skill
3+), the maintenance ambush trooper, barracks troopers (one more on skill
4-5), the officer, and on the generator a probe droid, two catwalk troopers
and one at the bottom. Two pad troopers guard the end.

## Later (after Phase 2)

- Objective 1: the data tape in the vault. Objective 2: the generator
  overload. The exit only works once both are done.
- The generator overload kills the lights, so the headlamp is needed on the
  way out.
