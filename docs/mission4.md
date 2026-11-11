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
  space behind a field. Mouse droids underfoot, interrogation droids in
  the cell block, and nothing but stars out of the hangar's mouth.

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
| 5 | The chute | The alarm seals the lift's door and sets the lane's lights pulsing; Rusk points at the hatch |
| 6-7 | Out of the compactor, up the tunnels | One way on |
| 8 | The terminal on the column | The bridge leads to it; the beam's glow |
| 9 | The hangar | Jan's line; one way on; the stars to the left |
| 1 | The Crow | The exit works once the beam is off |

## Areas (x, y in tiles; heights in units)

The map is 208 x 152. Everything not painted is the station's structure.
As built (`m4.js`).

| # | Area | Box (x0..x1, y0..y1) | Floor / ceiling | Notes |
|---|------|----------------------|-----------------|-------|
| 1 | Docking Bay 326 | 16..80, 56..104 | 0 / 22 | 32 m by 24 m. The mouth (15, 62..98, 7 m high) in the station's hull, a field across it, only stars beyond (Mark, 2026-11-10: just a starfield). The Crow in the middle, nose to the mouth, guide lines painted in from the mouth either side of it; three TIE fighters in cradles along the north wall; a shuttle and cargo in the south-east. Light bars up the walls, the crest over the control room's window high on the east wall. A gantry (a slab, top 8) along the south wall, a lift at its west end. The troop bay's door in the north wall. |
| 1a | Cargo lift and store | 64..70, 98..104; 64..70, 104..106 and 60..74, 106..112 | lift 0 to -8; -8 / -3 | Secret 1. The lift is marked with hazard stripes. |
| 1b | Troop bay | 30..50, 46..54 | 0 / 6 | Shut until the beam is off: the last fight's squad. |
| 2 | Lobby | 82..100, 94..106 | 0 / 6 | From the hangar's east door. Lift (86..90, 90..94) up to 8. The ring door east (remote). |
| 2 | Control room | 82..98, 64..90 | 8 / 14 | The window (80..82, 66..88, from 9 to 12) over the hangar. Consoles, the deck officer (blue keycard), the terminal in the east wall. |
| 3 | Ring corridor | 102..158 | 0 / 6 | 6 wide. East (y 97..103), then north-east at 45 degrees (x + y from 222 to 230), then east into the hub (y 77..83). Light columns and lit ceiling panels. |
| 3b | Briefing room | 104..122, 78..96 | 0 / 6 | Blue door (2 wide) in its south wall. The round table and eight chairs; what's on the table is read as you come up to it. Secret 2 behind its screen wall (110..116, 73..77). |
| 4 | Lift hub | 160..180, 70..90 | 0 / 8 | An octagon, a light column in its middle (168..172, 78..82) so no door looks straight at another. North: the detention lift (168..172, 64..68), 0 to 12. East: the pump room's door (shut from this side). |
| 5 | Detention control | 160..180, 44..62 | 12 / 17 | The desk, cameras, the officer (red keycard). The alarm's squad comes in by the lift door, which the alarm seals. |
| 5 | Cell corridor | 167..173, 12..43 | lane 11, kerbs 11.5 / 16 | Red door (2 wide). Five cells a side (5 x 4). Rusk in the last on the west. Secret 3: a loose panel in the second cell on the east. |
| 5 | Chute | 169..171, 4..12; 171..186, 4..6 | 11 down to 0, 4 high | A hatch in the end wall, opened when Rusk has spoken. Steps of 0.75. |
| 6 | Trash compactor | 186..202, 4..28 | -6 / 4 | Sludge, heaps of junk, something with one eye. A pressure hatch south. |
| 7 | Maintenance | 195..199, 30..64; 193..197, 92..100 | -5.5 up to 0 / +4 | Pipes, grate floors, dim. |
| 7 | Pump room | 186..204, 66..90 | 0 / 6 | Dark walls, four pumps floor to ceiling. An ambush. A switch in the east wall opens the hub's east door (the way back). |
| 8 | Tractor beam shaft | 156..200, 100..144 | -150 / 30 | A ledge 4 wide round it (slab, top 0, railed), a bridge 4 wide from the north ledge to the column (174..182, 118..126), a ledge 3 wide round the column, no rails on either. The terminal on the column's south face. Falling kills. |
| 9a | Bare deck | 112..154, 112..136 | 0 / 8 | Two gaps where the plates aren't on (2.25 deep, two steps out of each), girders, work lamps. |
| 9b | Panel yard | 78..108, 114..140 | 0 up to 8 / 16 | Stacks of wall panels, cable reels, stairs up its north wall to 8. |
| 9c | Open hull gallery | 16..76, 114..140 | 8 / 20 | The outer wall is bare truss and a field: the stars beside you. North door onto the hangar's gantry. |

## The kit (design language)

The Imperial base set (`imp-*`, Mission 3) is dark blue-grey and
industrial. The station is its own look: **pale cool grey walls, glossy
black decks, white light**, clean and new. Each area changes one thing.

- **Corridors:** the pale wall with a dark trim under the ceiling, a seam
  every metre and a black skirting. Walls hang from the ceiling, so it's
  one picture for each room height: `ds-wall-6` and `ds-wall-8` (rooms
  6 and 8 high; `ds-wall` is the plain plate, for lintels and odd
  heights). Light columns (`ds-wall-light`) on both sides, a lamp at
  each, so light comes in bars. `ds-floor`, `ds-ceiling` with a lit
  panel (`ds-ceiling-light`) over each pair of columns. Corners are cut
  at 45 degrees; the long run to the hub goes at 45 degrees, so the
  corridor is never one straight view.
- **Doors:** 4 wide and 4 tall (`ds-door`, one picture), in walls 2
  thick, a trapezoid surround standing proud (`ds-doorframe`, a model).
  Side rooms and cells 2 wide (`ds-door-narrow`; `ds-door-red` and
  `ds-door-blue` for the locked ones). Switches are one picture floor to
  ceiling for a room 6 high (`ds-switch`), so the panel isn't repeated up
  the wall. Signs by the doors (`decal-sign`, the base set's).
- **Hangar:** `ds-hangar-wall` in big ribbed bands, light bars up it
  (`ds-hangar-light`), the crest (`decal-crest`) over the control room's
  window; `ds-floor-hangar` with painted guide lines in from the mouth
  and hazard stripes at its edge and on the cargo lift. Lit from above in
  pools, the walls falling into the dark.
- **Detention:** black (`ds-det-wall`), red light slots, the lane's floor
  a red light grid (`ds-det-floor-light`), a low ceiling. The only red
  on the station.
- **Compactor and maintenance:** the station's guts: `ds-compactor-wall`,
  sludge (`water-murky`), pipes (`ds-wall-greeble`), `ds-floor-grate`.
  Dim, a flickering lamp. Pipes up the walls and the pumps leak steam
  (`ds-steam-pipe`: a thin plume, a hiss every few seconds); the
  compactor's walls are streaked with grime.
- **The shaft:** `ds-wall-dark` falling out of sight, light columns down
  it at intervals, the column glowing.
- **Unfinished sector:** `ds-girder` where the panels aren't on yet,
  bare decks (`ds-floor-grate`), work lamps in pools, the rest dark.
  Cut cables hang from the ceilings (`ds-cables`); the live ones
  (`ds-cables-live`) spit sparks, a flickering light at each. A beam
  across the top of each girder post; one work lamp on the blink.
- **Outside:** `sky-space`, only stars. No backdrop.

Models (`models/station.js`): `tie-fighter`, `tie-rack`, `lambda-shuttle`,
`ds-console`, `ds-console-wall`, `ds-desk`, `ds-table`, `ds-chair`,
`ds-crate`, `ds-crate-tall`, `ds-container`, `ds-doorframe`,
`tractor-terminal`, `ds-girder-post`, `ds-girder-beam`, `ds-panel-stack`,
`ds-cable-reel`, `work-lamp`, `ds-cables`, `ds-cables-live`, `ds-steam-pipe`, `ds-camera`, `ds-ceiling-lamp-bar`,
`dianoga-eye`.

Characters: stormtroopers, officers, probe droids; new: the
interrogation droid (a monster, generated art) and the mouse droid (a
friendly that squeals and runs).

Music `station` (slow, D minor: a drone, a heartbeat of drums, a horn
call, bells). Sounds `alarm-klaxon` (Rusk's alarm), `beam-down` (the
terminal), `mouse-droid-squeal`. Not made: a turbolift's own sound, the
compactor's groan, the field's hum.

## Light

Indoors there is no haze. 120 reads dark with these textures, 160 normal.

- Hangar 144, pools of 200 under the lamp bars, 176 at the mouth, a lamp
  at each light bar.
- Control room 152, the screens' glow pulsing; lobby 168.
- Corridors 160, 208 under the lit panels, a lamp at each light column.
- Briefing room 136, the table's centre lit.
- Detention 120 to 136, the lane's red grid 168 (pulsing 88 to 216 once
  the alarm sounds).
- Compactor 136, a flicker in the middle; maintenance 120 with pools of
  176; pump room 144.
- The shaft 112, the walks 152, the column's glow pulsing until the beam
  is off, then dim and still.
- Unfinished sector 120, work lamps +112.

## Secrets (3)

1. The hangar's cargo lift down to the store (a shield unit, cells).
2. Behind the briefing room's screen wall (the concussion rifle).
3. A loose panel in an empty cell (an energy pack, detonators).

## Enemies and items by skill

Skill 1 thins every fight; 2 adds a trooper or an officer to most areas;
3 adds droids and a third wave; 4 and 5 are the same placement (skill 5
also makes monsters faster and doubles ammo pickups, set in the engine).
Totals: 22 monsters on skill 1, 33 on 2, 46 on 3, 55 on 4 and 5, plus the
alarm's two troopers on every skill.

| Area | Every skill | 2+ | 3+ | 4+ |
|------|-------------|----|----|----|
| Hangar | 2 mouse droids | | a trooper by the north-east crates | |
| Troop bay (comes out when the beam is off) | 3 troopers | a 4th trooper, an officer | a 5th trooper | a 6th trooper, a probe droid |
| Lobby | a trooper | a 2nd trooper | | |
| Control room | the deck officer (blue keycard), a trooper | | a trooper at the screens | |
| Ring corridor | 2 troopers, 2 mouse droids | a trooper on the slant | an officer by the hub door | a 2nd trooper on the slant |
| Briefing room | an officer | a 2nd officer | a trooper | |
| Hub | 2 troopers | | a trooper by the lift | a probe droid |
| Detention control | the officer at the desk (red keycard), 2 troopers; the alarm's 2 troopers | an interrogation droid | a 3rd trooper | |
| Cell corridor | Rusk, a prisoner | | an interrogation droid in the lane | a trooper at the far end, an interrogation droid in a cell (ambush) |
| Maintenance | | a trooper in the tunnel | | |
| Pump room | 2 troopers (ambush) | | a probe droid | |
| Shaft | a trooper on the west ledge, one on the east | a trooper on the south ledge | a probe droid over the drop | a 2nd south trooper, a 2nd probe droid |
| Bare deck | 2 troopers | a 3rd trooper | a probe droid | |
| Panel yard | a trooper | a trooper at the top of the stairs | an officer | |
| Gallery | a trooper | a 2nd trooper | a 3rd trooper | a probe droid |

Items: power cells, energy packs and med kits along the route; a thermal
detonator among the hangar's cargo; med kits in the control room, the
hub, detention control, the compactor, the pump room, the shaft's north
ledge, the panel yard and the gantry passage on every skill. Extra med
kits in the briefing room and a shield unit at the gallery's end (skills
1-3), and a med kit in a cell (skills 1-2). The ammo budget is 11.8
times what the monsters need (the validator's figure; Mission 3 has
12.6).

## Engine notes

- **The view out of the mouth.** Sky only shows between two sky tiles,
  so the mouth's own column of deck is a sky tile with a low ceiling (the
  hangar's wall above it is its `upper`), and the tiles beyond are sky
  tiles 90 down whose sky starts just above their floor. Everything out
  there is then sky.
- **The last exit** is a trigger on the tiles under the Crow, `if` the
  beam is off (Mission 1 ends the same way).
- **Walls hang from the ceiling.** A wall's texture starts at the ceiling
  of the room in front of it and repeats downward, so a skirting or a
  switch at a set height has to be one tall picture made for that room's
  height (the kit's `-6` and `-8` walls, the switch).

## Checked

- `tests/m4-route.test.js` walks the whole route with no monsters: 105 s
  of game time from the hangar to the exit. It found the chute's roof too
  low for a body (2.5 over steps of 0.75) and the column's ledge too
  narrow to turn on; both are fixed.
- Frame time, headless at 640 x 400 (2026-11-10): the hangar's worst
  corner about 30 ms, the corridors 6, the shaft and the unfinished decks
  13 to 15. Mos Eisley's open street measured 29 ms on the same run.
- Not checked: the fights (nobody has played it), the sounds and the
  song by ear.
