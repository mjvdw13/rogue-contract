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
| 2 | Gorge | 14..34, 60..76 | 0 / sky | Winds north-east, with angled rock walls. A natural rock arch spans it (14..34, 64..67): a slab from 4 to 5 that you walk under, with a sniper on top (skills 2+) facing the start bowl. There's no way up. |
| 3 | The bowl | 20..60, 44..60 | 0 / sky | Landmark: a rock spire (chamfered 6x6 block at 35..41, 49..55). Sniper ledge A (west, 20..24, floor 5) can't be reached. Ledge B (east, 56..60, floor 5) is reached by rock steps at its south end. |
| 4 | Garrison face | 26..70, 36..40 | wall | Imperial wall facing the canyon, 4 m tall with the cliff's rock above it (wall bands), with a locked main gate (44..52) between light strips, the Empire's crest over it and hazard stripes along its lintel (decals). The vent mouth is at 32..34. |
| 5 | Vent | 32..34, 26..40 | 0.5 / 1.7 | Crouch only (1.2 clear). |
| 6 | Maintenance | 26..42, 14..26 | 0 / 5 | Dim, grate floor, with a lit panel in the middle. Crates in a storage cage (a see-through fence), a console, an ambush trooper. |
| 7 | Lift L1 shaft | 42..46, 16..20 | lift 0 → 6 / 12 | Opens west at 0 and east at 6. |
| 8 | Barracks corridor | 46..77, 16..20 | 6 / 10 | Light strips, hanging lamps. A trooper. |
| 9 | Bunk room | 48..60, 4..15 | 6 / 10 | Door 53..55 x 15..16. Troopers, crates for bunks, a med kit. |
| 10 | Officer's office | 62..72, 4..15 | 6 / 9 | Door 65..67 x 15..16. An officer carrying the **red keycard** (dropped when killed), a console. A barred window (69..71 x 15..16, over a sill at 7) looks in from the corridor. |
| 11 | Red door | 77..78, 17..19 | 6 | Into the vault. |
| 12 | Data vault | 78..92, 10..25 | 6 / 9 | Dark (light 96), computer-bank walls, chamfered corners, ammo, guards against the far banks. Secret niche (92..96, 14..18) behind a computer-bank door: a shield. South door 84..86 x 25..26 onto the generator catwalk. |
| 13 | Generator chamber | 72..108, 26..62 | -6 / 18 | Catwalk ring at 6 (3 wide). Central reactor column (86..94, 40..48) with chamfered corners. North and south bridges (88..92) join the ring to the column. The ring and bridges are grate slabs (5.5 to 6): the shaft floor runs on underneath them, one open space round the column and out to the walls. Lifts L2 (75..79, 55..59, south-west) and L2b (101..105, 29..33, north-east) run -6 ↔ 6. The overload switch is on the column's south face at the bottom: it opens `escape`, dims the chamber and shows a message. Railings (0.75 tall) along the ring's inner edge and both sides of the bridges, open where the lifts and bridges join. Probe droid, troopers, fuel barrels at the bottom. |
| 14 | Escape hatch | 108..109, 43..45 | 6 | Remote-locked door, tag `escape`, with a landing outside (109..110, 42..46). |
| 15 | Gantry | 110..118, 42..46 | 6 → 8 / sky | Stairs up 0.5 per tile to 8. |
| 16 | Chasm | 118..121, 34..58 | -2 / sky | The 3-tile jump. Lift L3 (118..121, 54..58) runs back up (-2 ↔ 8) if you fall. |
| 17 | Landing pad | 121..126, 34..58 | 8 / sky | Troopers. The exit is the marked pickup spot on the pad (122..126, 43..47). |

## Lighting

Light is per tile (0-255; walls take the light of the tile in front of
them). With the Dark Forces textures, 120 already reads as a dark corner and
anything under about 110 as black, so dark places stay at 112-128 and the
contrast comes from bright pools (184-224).

- **Canyon:** moonlight at 144 (152 in the start bowl), the narrow gorge at
  136, the spire's shadow and the ledges a little darker, the strip along
  the garrison face in shadow (120). The rock arch is moonlit on top (152)
  and casts its shadow under it (112). Floodlights in the gate's light
  strips (light sources, +96 fading out over 3 m) throw pools on the sand
  and the wall, with a weaker light over the gate (+40). The rock alcove
  is dark (112). Far off, the canyon fades into the night's purple haze
  (`haze: { color: [32, 24, 64], half: 40 }`, halfway at 20 m) instead of
  going black.
- **Skyline:** the canyon's walls end 4.5 to 6 m up at a rim of rock out
  of reach (one tile, its sky just above it so the view ends there),
  rising to meet the taller cliff the garrison is built into. Above and
  behind the rim, the backdrop (`canyonBackdrop`) climbs in moonlit slopes
  and ridges out to 48 m past the map, light 168, fading into the haze.
- **Vent:** 112, with light falling through a grate halfway (144).
- **Maintenance:** 128, a bright panel in the middle (192), dark west
  corners (120), and a broken ceiling light flickering in the south-east.
- **Barracks:** the corridor at 144 with pools under the ceiling panels
  (208), and light sources at the light strips and the hanging lamps
  (+48). The bunk room at 128
  with a ceiling light in the middle and dark north corners; the office at
  144 with a light over the desk.
- **Vault:** 112, with the screens' glow pulsing (104-152) along the
  computer banks. The niche 120.
- **Generator:** the shaft floor dark (128), darker under the catwalks
  (120), a slow pulse (136-200) round the reactor column, catwalks at 152
  with light strips on the chamber walls: each has a lamp over the catwalk
  (+48) and one under it lighting the floor below (+56), tagged
  `gen-lamps`. The overload switch drops the whole chamber to a dim
  flicker (136, dipping to 72; under the catwalks as much darker as
  before), and the lamps sputter (+32 or off).
- **The way out:** the chasm dark (104), the pad floodlit (184), and the
  pickup spot pulsing (168-224).

## Secrets (3)

1. The start bowl's rock alcove (shield unit).
2. The vault's computer-bank niche (shield unit).
3. Ledge B in the bowl. It's reachable but tucked away, so it's marked secret
   (energy pack, and a view down on the gate).

## Enemies and items by skill

Skills 1-2 thin the fights and add med kits; 4-5 add a trooper or two to
most areas (skill 5 also makes monsters faster and doubles ammo pickups, set
in the engine). Totals: 14 monsters on skill 1, 19 on 2, 23 on 3, 30 on 4
and 31 on 5.

| Area | Every skill | 2+ | 3+ | 4+ (5 only) |
|------|-------------|----|----|-------------|
| Canyon | snipers on ledges A and B, a gate sandtrooper, 2 Jawas | a 2nd gate sandtrooper, a sniper on the rock arch | the probe droid, a 3rd Jawa | a sandtrooper under ledge A, a 4th Jawa |
| Maintenance | the ambush trooper by the lift | | | a 2nd ambush trooper on the west side |
| Barracks | a corridor trooper, a bunk-room trooper, the officer (red keycard) | a 2nd bunk-room trooper | a trooper by the red door | a 3rd bunk-room trooper |
| Vault | a guard by the far banks | | a 2nd guard | an officer by the south door |
| Generator | the probe droid (over the north bridge), a catwalk trooper (north-west), one on the floor (west) | an east catwalk trooper | | a south catwalk trooper (a 2nd probe droid down on the floor, west) |
| Landing pad | a stormtrooper | a sandtrooper | | a 2nd stormtrooper |

Items: power cells, energy packs and med kits along the route (the bunk room
and the generator floor have med kits on every skill). Extra med kits by the
vent mouth after the gate guards and on the gantry before the pad (skills
1-3), and in the office (skills 1-2). The vent has a power cell where the
light falls through, and there's one in the dark under the generator's
catwalk ring (north-west corner).

## Later (after Phase 2)

- Objective 1: the data tape in the vault. Objective 2: the generator
  overload. The exit only works once both are done.
- The generator overload could kill the lights outright once the headlamp
  exists (for now it leaves a dim flicker).
