# Mission 4: the Battle Station (design)

A level on the first Death Star (Mark, 2026-11-10: a hangar, hallways and
a detention block at least; fresh and interesting but familiar). Built as
Mission 3 is: painted in code (`src/content/levels/m4.js`, `lib/painter.js`),
with its own kit of textures and models. Playable at `?map=m4`. It isn't in
the episode yet: where it sits in the story is Mark's call (below).

## Story (a proposal: Mark decides)

The story so far ends with the Crow clear of the Jundland and the Alliance
filing Kyle's report as unconfirmed. This mission goes between the garrison
and the finale, and gives the finale its reason.

- **How they get there.** The garrison's vault records name where the
  prototype's test data was sent: "the Station". Jan follows the general's
  shuttle's last heading to see what Mohc answers to. The Crow drops out of
  hyperspace beside something the size of a small moon, half its plating
  still open girders, and a tractor beam has it before Jan can turn.
- **The start.** Docking Bay 326. The scan crew found Rusk asleep in the
  hold and took him to the detention level. Kyle and Jan were under the
  deck plates, in the Crow's smuggling hold. Jan stays with the ship: it
  can't lift while the beam holds it. Kyle goes for Rusk and the beam.
- **Why Kyle goes back for him.** Rusk is the only witness to the test,
  and he walked away from the Empire, as Kyle did.
- **The irony of a prequel, again.** Kyle doesn't know what the station
  is. He sees a hangar, corridors, a cell block and a shaft with no
  bottom. In the briefing room he finds Mohc's project on the table,
  approved, and a line about the station's "primary weapon". The Alliance
  files the prototype as unconfirmed, but nobody can file a moon: the next
  job is the station's plans, on Danuta. That is Dark Forces' first
  mission.
- **Familiar, on purpose.** A ship caught by the tractor beam, a hiding
  place under the deck, the control room over the hangar, the detention
  block, the trash compactor, the tractor beam's terminal over the shaft:
  the beats of the film's rescue, months before it, with a mercenary
  instead of a farm boy and nobody to tell him the odds.
- **Fresh.** The station isn't finished. One sector on the way back is
  bare girders, missing deck plates and work lamps, its outer wall open to
  the trench behind a field. Mouse droids underfoot, interrogation droids
  in the cell block, and the view from the hangar's mouth across the
  trench to its far wall, the planet over it.

Sample lines (stand-ins, like every level's):

> JAN: They took Rusk. Detention level, I'd bet. I can't lift with that
> beam on us.
>
> KYLE: Then I'll get him, and I'll find the plug.
>
> JAN: The room over the bay, behind the glass. Start there.

The finale's text would change by one paragraph: "The Alliance filed the
prototype as unconfirmed. They did not file the station."

**To decide (Mark):** whether this is the story's Mission 4 (after the
garrison) or a bonus level; Rusk freed here (then Mission 3's detention
block goes) or a new prisoner; and whether Kyle should see Mohc or the
Grand Moff through the briefing room's window (no sprite for either yet).

## Flow

A chain (areas in a line, each with a named, visible goal), closing in a
loop back to the hangar:

```
[1 hangar 326] -> [2 lobby, lift, control room: the terminal] -> the ring door opens
   -> [3 ring corridor] (blue door: [3b briefing room], optional)
   -> [4 lift hub] -> lift up -> [5 detention AA-19: desk, red door, cells, Rusk]
   -> the chute -> [6 trash compactor] -> hatch -> [7 maintenance, pump room]
   -> [8 tractor beam shaft: the terminal on the column] -> the west door opens
   -> [9 unfinished sector: bare deck, panel yard, open hull gallery]
   -> the gantry over [1 hangar]: the squad from the troop bay, the Crow, out.
```

| Step | Goal | How the player knows |
|---|---|---|
| 1 | The room behind the glass | Jan's line; the lit window faces the start |
| 2 | The terminal | Its screen; it opens the ring door and names the cell block and the beam |
| 3-4 | The detention lift | Signs along the corridor; one way on |
| 5 | Rusk, last cell on the left | Jan's line; his name over his head once the door is open |
| 5 | The chute | The alarm shuts the lift; Rusk points at the hatch |
| 6-7 | Out of the compactor, up the tunnels | One way on |
| 8 | The terminal on the column | The bridge leads to it; the beam's glow |
| 9 | The hangar | Jan's line; one way on; the trench to the left |
| 1 | The Crow | The exit works once the beam is off |

## Areas (x, y in tiles; heights in units)

The map is 208 x 152. Everything not painted is the station's structure.

| # | Area | Box (x0..x1, y0..y1) | Floor / ceiling | Notes |
|---|------|----------------------|-----------------|-------|
| 1 | Docking Bay 326 | 16..80, 56..104 | 0 / 22 | 32 m by 24 m. The mouth (15, 62..98, 7 m high) in the trench's east wall, a field across it. The Crow in the middle, nose to the mouth; three TIE fighters in cradles along the north wall; a shuttle and cargo in the south-east. The control room's window high on the east wall. A gantry (a slab, top 8) along the south wall, a lift at its west end. The troop bay's door in the north wall. |
| 1a | Cargo lift and store | 64..70, 97..103; 62..72, 104..114 | lift 0 to -8; -8 / -3 | Secret 1. The lift is marked with hazard stripes. |
| 1b | Troop bay | 30..50, 46..54 | 0 / 5 | Shut until the beam is off: the last fight's squad. |
| 2 | Lobby | 82..100, 94..106 | 0 / 5 | From the hangar's east door. Lift (86..90, 90..94) up to 8. The ring door east (remote). |
| 2 | Control room | 82..98, 64..90 | 8 / 13 | The window (80..82, 66..88) over the hangar. Consoles, the deck officer (blue keycard), the terminal. |
| 3 | Ring corridor | 101..160 | 0 / 6 | 6 wide. East, then north-east at 45 degrees, then east into the hub. Light columns every 8 tiles. |
| 3b | Briefing room | 104..122, 78..94 | 0 / 6 | Blue door. The round table, the project file (lore), officers. Secret 2 behind its screen wall. |
| 4 | Lift hub | 160..180, 70..90 | 0 / 8 | An octagon. North: the detention lift (168..172, 62..66), 0 to 12. East: the pump room's door (shut from this side). |
| 5 | Detention control | 160..180, 44..62 | 12 / 17 | The desk, cameras, the officer (red keycard). |
| 5 | Cell corridor | 167..173, 12..43 | lane 11, kerbs 11.5 / 16 | Red door. Five cells a side (5 x 4). Rusk in the last on the west. Secret 3: a cell's loose panel. |
| 5 | Chute | 169..171, 4..12; 171..186, 4..6 | 11 down to 0 | A hatch in the end wall, opened when Rusk has spoken. Steps of 0.75. |
| 6 | Trash compactor | 186..202, 4..28 | -6 / 4 | Sludge, heaps of junk, something with one eye. A pressure hatch south. |
| 7 | Maintenance | 195..199, 29..52; 193..197, 70..100 | -5 up to 0 / +4 | Pipes, grate floors, dim. |
| 7 | Pump room | 186..204, 52..70 | 0 / 6 | An ambush. A switch opens the hub's east door (the way back). |
| 8 | Tractor beam shaft | 156..200, 100..144 | -60 / 30 | A ledge round it (slab, top 0), a bridge from the north ledge to the column (174..182, 118..126), a ledge 2 wide round the column. The terminal on the column's south face. Falling kills. |
| 9a | Bare deck | 112..154, 112..136 | 0 / 8 | Missing plates (pits to -3), girders, work lamps, sparks. |
| 9b | Panel yard | 78..112, 112..140 | 0 up to 8 / 16 | Stacks of wall panels, cable reels, stairs up to 8. |
| 9c | Open hull gallery | 18..78, 112..144 | 8 / 20 | The outer wall is bare truss and a field: the trench beside you. North door onto the hangar's gantry. |

## The kit (design language)

The Imperial base set (`imp-*`, Mission 3) is dark blue-grey and
industrial. The station is its own look: **pale cool grey walls, glossy
black decks, white light**, clean and new. Each area changes one thing.

- **Corridors:** `ds-wall` with a black skirting (`ds-skirt`, a band 1
  tall) and a dark trim at the top; every 8 tiles a light column
  (`ds-wall-light`) on both sides, a lamp at each, so light comes in
  bars. `ds-floor`, `ds-ceiling` with a lit panel (`ds-ceiling-light`)
  over each pair of columns. Corners are cut at 45 degrees; the long run
  to the hub goes at 45 degrees, so the corridor is never one straight
  view.
- **Doors:** 4 wide and 4 tall (`ds-door`, one picture), in walls 2
  thick, a trapezoid surround standing proud (`ds-doorframe`, a model).
  Side rooms and cells 2 wide (`ds-door-narrow`, `ds-door-cell`). Lifts
  have their own (`ds-door-lift`).
- **Hangar:** `ds-hangar-wall` in big ribbed bands, machinery
  (`ds-wall-greeble`) along the foot, dark panels above; `ds-floor-hangar`
  with painted guide lines to the mouth and hazard stripes at its edge
  and round the lift. Lit from above in pools, the walls falling into
  the dark. The mouth is the brightest thing in it.
- **Detention:** black (`ds-det-wall`), red light slots, the lane's floor
  a red light grid (`ds-det-floor-light`), a low ceiling. The only red
  on the station.
- **Compactor and maintenance:** the station's guts: `ds-compactor-wall`,
  `ds-sludge`, `ds-pipes`, `ds-floor-grate`. Dim, a flickering lamp.
- **The shaft:** `ds-wall-dark` falling out of sight, light columns down
  it at intervals, the column glowing.
- **Unfinished sector:** `ds-girder` where the panels aren't on yet,
  bare decks (`ds-floor-grate`), work lamps in pools, the rest dark.
- **Outside:** `sky-space` (stars, the planet in the west) and the
  trench's far wall and floor as the backdrop (`ds-hull`).

Models (`models/station.js`): `tie-fighter`, `tie-rack`, `lambda-shuttle`,
`ds-console`, `ds-console-wall`, `ds-desk`, `ds-table`, `ds-chair`,
`ds-crate`, `ds-crate-tall`, `ds-container`, `ds-doorframe`,
`tractor-terminal`, `ds-girder-post`, `ds-girder-beam`, `ds-panel-stack`,
`ds-cable-reel`, `work-lamp`, `ds-camera`, `ds-ceiling-lamp-bar`,
`dianoga-eye`.

Characters: stormtroopers, officers, probe droids; new: the
interrogation droid (a monster, generated art) and the mouse droid (a
friendly that squeals and runs).

Music `station`; sounds `alarm-klaxon`, `tractor-hum-down`, `turbolift`,
`compactor-groan`, `field-hum`, `mouse-droid-squeal`.

## Light

Indoors there is no haze. 120 reads dark with these textures, 160 normal.

- Hangar 144, pools of 200 under the lamp bars, 176 at the mouth.
- Control room 152, the screens' glow pulsing; lobby 168.
- Corridors 160, 216 at the light columns (lamps +56).
- Briefing room 136, the table's centre lit.
- Detention 120, the lane's red grid 168.
- Compactor 112, a flicker; maintenance 120 with pools of 176.
- The shaft 128, the column's glow pulsing (144 to 208) until the beam
  is off, then 104 and still.
- Unfinished sector 104, work lamps +96.

## Secrets (3)

1. The hangar's cargo lift down to the store (a shield unit, cells).
2. Behind the briefing room's screen wall (the concussion rifle).
3. A loose panel in an empty cell (an energy pack, detonators).

## Enemies and items by skill

To be filled in from `m4.js` once the fights are placed (the table as in
`docs/mission3.md`).

## Engine notes

- **The view out of the mouth.** Sky only shows between two sky tiles,
  so the mouth's own column of deck is a sky tile with a low ceiling (the
  hangar's wall above it is its `upper`), and the tiles beyond are sky
  tiles 90 down whose sky starts just above their floor. Everything out
  there is then sky, and the backdrop draws over it: the trench.
- **The last exit** is a trigger on the tiles under the Crow, `if` the
  beam is off (Mission 1 ends the same way).
