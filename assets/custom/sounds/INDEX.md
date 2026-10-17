# Dark Forces sound effects, by what they are

Every sound from "Sound Effects.zip" (Dark Forces' sound effects as
MP3s), sorted into folders by what each one is. Read `../DISCLAIMER.md`:
these are Lucasfilm's and must not be redistributed.

- Names are Dark Forces' own. Seven files in the zip were the same
  sound under a second name; each is here once, with the other name noted.
- What a sound is comes from its name and Dark Forces; "(guess)" marks
  the uncertain ones. `tools/soundboard.html` plays them all.
- Length is the sound itself, without the silence around it (each file
  has 25-80 ms before it, which the game trims, and ~0.4 s after).
- `../sound-overrides.json` picks which of these the game plays.

| Folder | Count | What's in it |
| --- | ---: | --- |
| [weapons](#weapons) | 22 | Kyle's weapons: shots, dry clicks when out of ammo, fists. |
| [impacts-explosions](#impacts-explosions) | 12 | Bolt hits, ricochets, fly-bys and explosions. |
| [doors-lifts-switches](#doors-lifts-switches) | 27 | Doors, lifts (start, moving, stop sets), switches, a crusher and the locked-door sound. |
| [pickups-gear](#pickups-gear) | 15 | Item pickups, and gear switching on and off. |
| [player](#player) | 7 | Kyle: death, jumping, landing, water. |
| [enemies](#enemies) | 35 | Enemy shots, alerts, grunts, pain and deaths. |
| [ambience](#ambience) | 8 | Loops for places: wind, machinery, rumble, water. |
| [vehicles](#vehicles) | 6 | Ships taking off and landing. |
| [interface](#interface) | 7 | Beeps, mission complete, the logo. |

## weapons

| Sound | Length | What it is |
| --- | --- | --- |
| PISTOL-1 | 0.35s | Bryar pistol shot (Kyle's blaster). |
| RIFLE-1 | 0.39s | E-11 blaster rifle shot (stormtroopers). |
| REPEATER | 0.73s | Imperial repeater gun, a burst. |
| REPEAT-1 | 0.39s | Imperial repeater gun, one shot. |
| FUSION1 | 0.66s | Jeron fusion cutter shot. |
| FUSION2 | 0.36s | Jeron fusion cutter shot (second). |
| MORTAR2 | 0.44s | Packered mortar gun (guess: firing). |
| MORTAR4 | 0.93s | Packered mortar gun (guess: shell in flight). |
| MORTAR9 | 0.39s | Packered mortar gun (guess: shell landing; a dull thud). |
| CONCUSS1 | 0.53s | Stouker concussion rifle: fired with no ammo left. |
| CONCUSS5 | 0.90s | Stouker concussion rifle: the shot (the player's, and Bossk's). |
| CONCUSS6 | 0.26s | Stouker concussion rifle: the trigger's crack, with CONCUSS5 (the player's only). Its blast is EX-LRG1. |
| PLASMA4 | 0.72s | Assault cannon plasma shot. |
| MISSILE1 | 0.62s | Assault cannon missile launch. |
| THERMAL1 | 0.10s | Thermal detonator bouncing (a metal clank). |
| CLAYMOR1 | 0.17s | I.M. mine arming. |
| PISTOUT1 | 0.28s | Pistol out of ammo (dry click). |
| RIFLOUT | 0.31s | Rifle out of ammo (dry click). |
| REP-EMP | 0.40s | Repeater out of ammo. |
| PLAS-EMP | 0.44s | Assault cannon out of ammo. |
| SWING | 0.12s | Fist swing. Same file as BUTT1. |
| PUNCH | 0.47s | Fist hitting. Same file as BUTT2. |

## impacts-explosions

| Sound | Length | What it is |
| --- | --- | --- |
| EX-TINY1 | 0.55s | Blaster bolt hitting a wall. |
| EX-SMALL | 0.98s | Small explosion. |
| EX-MED1 | 0.99s | Medium explosion (barrels, droids). |
| EX-LRG1 | 1.36s | Large explosion. |
| BOLTREF1 | 0.65s | A bolt ricocheting (guess). |
| BIGREFL1 | 0.44s | A big bolt ricocheting (guess). |
| LASRBY | 0.47s | A laser bolt whizzing past. |
| LASRFLY | 2.98s | A laser bolt flying past, long. Same file as LASRBY1. |
| EMISBY | 0.39s | A missile whooshing past (guess). Same file as EMISBY1. |
| FIREBALL | 0.56s | A fireball (guess). |
| FLAME-1 | 0.87s | Flame burst (guess). |
| BULLET | 1.60s | (Unknown: bullet or ricochet.) |

## doors-lifts-switches

| Sound | Length | What it is |
| --- | --- | --- |
| DOOR | 1.67s | The standard Imperial door. |
| DOOR-04 | 1.34s | A door (variant). |
| DOOR1-1 | 1.12s | Door set 1: start. |
| DOOR1-2 | 1.55s | Door set 1: moving. |
| DOOR1-3 | 0.15s | Door set 1: stop. |
| DOOR2-1 | 1.34s | Door set 2: start. |
| DOOR2-2 | 0.39s | Door set 2: moving. |
| DOOR2-3 | 0.26s | Door set 2: stop. |
| DOOR3-1 | 1.34s | Door set 3: start. |
| DOOR3-2 | 2.46s | Door set 3: moving. |
| DOOR3-3 | 0.48s | Door set 3: stop. |
| ELEV1-1 | 0.20s | Lift set 1: start. |
| ELEV1-2 | 1.33s | Lift set 1: moving. |
| ELEV1-3 | 0.86s | Lift set 1: stop. |
| ELEV2-1 | 0.92s | Lift set 2: start. |
| ELEV2-2 | 1.55s | Lift set 2: moving. |
| ELEV2-3 | 0.84s | Lift set 2: stop. |
| ELEV3-1 | 0.86s | Lift set 3: start. |
| ELEV3-2 | 1.20s | Lift set 3: moving. |
| ELEV3-3 | 0.85s | Lift set 3: stop. |
| ELEVOFF3 | 0.82s | A lift powering down (guess). |
| ELEVRUN2 | 3.87s | A lift running, long. |
| CRUSH | 2.85s | A crusher. |
| LOCKED-1 | 0.60s | A locked door. |
| SWITCH1 | 0.36s | Wall switch 1. |
| SWITCH2 | 0.54s | Wall switch 2. |
| SWITCH3 | 0.41s | Wall switch 3. |

## pickups-gear

| Sound | Length | What it is |
| --- | --- | --- |
| AMMO | 0.57s | Energy ammo pickup. |
| HEALTH1 | 0.53s | Med kit pickup. |
| HEALTH2 | 0.76s | Health pickup (second). |
| SHIELD1 | 0.36s | Shield unit pickup. |
| SHIELD2 | 0.58s | Shield pickup (second). |
| KEY | 0.55s | Key pickup. |
| WEAPON1 | 0.68s | Weapon pickup. |
| POWER1 | 1.98s | Power-up (guess: battery or revive). |
| BONUS | 1.28s | Bonus or extra life. |
| REVIVAL | 1.28s | Revive or extra life (guess). |
| GOGGLES1 | 0.96s | IR goggles on. |
| GOGGLES2 | 1.31s | IR goggles off. |
| MASK1 | 1.16s | Gas mask on. |
| MASK2 | 0.78s | Gas mask off. |
| CLEAT | 2.08s | Ice cleats. |

## player

| Sound | Length | What it is |
| --- | --- | --- |
| KYLEDIE1 | 4.32s | Kyle's death. |
| JUMP-1 | 0.36s | Jumping. |
| LAND-1 | 0.41s | Landing. |
| SPLASH1 | 1.32s | Splashing into water. Same file as SWIM-IN. |
| SWIM-OUT | 1.72s | Climbing out of water. |
| SWIM | 3.12s | Swimming. |
| SNOW | 1.81s | Walking in snow (guess). |

## enemies

| Sound | Length | What it is |
| --- | --- | --- |
| PROBALM | 1.21s | Probe droid alarm. |
| PROBALM1 | 0.34s | Probe droid alarm (short). |
| PROBALM2 | 0.16s | Probe droid beep. |
| PROBFIR1 | 0.34s | Probe droid shot. |
| INTALERT | 0.92s | Interrogation droid alert. |
| INTSTUN | 0.64s | Interrogation droid stun. |
| REMOTE-2 | 0.59s | Training remote. |
| TURRET-1 | 0.60s | Ceiling turret shot. |
| EEEK-1 | 0.41s | Mouse droid squeak. |
| EEEK-2 | 0.62s | Mouse droid squeak. Same file as EEEK2. |
| EEEK-3 | 1.26s | Mouse droid squeak, long. Same file as EEEK3. |
| GAMOR-1 | 0.60s | Gamorrean guard grunt. |
| GAMOR-2 | 0.68s | Gamorrean guard grunt. |
| GAMOR-3 | 0.51s | Gamorrean guard grunt. |
| AXE-1 | 0.65s | Gamorrean axe swing. |
| BOSSK-1 | 1.16s | Bossk. |
| BOSSK-2 | 0.93s | Bossk. |
| BOSSK-3 | 0.95s | Bossk. |
| BOSSKDIE | 1.47s | Bossk's death. |
| KELL-1 | 1.60s | Kell dragon. |
| KELL-2 | 4.19s | Kell dragon, long. |
| KELL-5 | 0.96s | Kell dragon. |
| KELL-7 | 4.20s | Kell dragon, long. |
| KELL-8 | 0.78s | Kell dragon. |
| KELLJUMP | 0.78s | Kell dragon leaping. |
| CREATUR1 | 3.75s | Sewer creature (dianoga), long. |
| CREATUR2 | 3.03s | Sewer creature (dianoga). |
| CREATHRT | 0.68s | Sewer creature hurt. |
| CREATDIE | 4.03s | Sewer creature death. |
| WELD-1 | 0.63s | Welding arm. |
| WELD-2 | 1.15s | Welding arm, longer. |
| WELDSHT1 | 0.47s | Welding arm shot. |
| WELDHRT | 0.31s | Welding arm hurt. |
| WELD-DIE | 1.09s | Welding arm destroyed. |
| SWORD-1 | 0.60s | A blade swing (guess: Dark Trooper). |

## ambience

| Sound | Length | What it is |
| --- | --- | --- |
| WIND1 | 9.72s | Wind, 10 s. |
| MACHINE1 | 9.64s | Machinery hum, 10 s. |
| MACHINE2 | 3.48s | Machinery hum. |
| RUMBLE1 | 3.29s | A low rumble. |
| ELECTRIC | 3.00s | Electrical crackle. |
| WATER1 | 3.34s | Running water. |
| WATER2 | 3.16s | Running water. |
| CONVEYER | 2.01s | A conveyor belt. |

## vehicles

| Sound | Length | What it is |
| --- | --- | --- |
| TAKEOFF1 | 3.07s | A ship taking off. |
| TAKEOFF2 | 3.49s | A ship taking off. |
| LANDING1 | 3.58s | A ship landing, long. |
| LANDING2 | 0.92s | A ship landing. |
| ROCKET-1 | 2.93s | A rocket or engine roar (guess). |
| ROCKET-2 | 2.98s | A rocket or engine roar (guess). |

## interface

| Sound | Length | What it is |
| --- | --- | --- |
| BEEP-01 | 0.77s | A beep. |
| BEEP-10 | 0.30s | A beep. |
| COMPLETE | 0.75s | Mission complete. |
| QUARTER | 0.29s | (Unknown: a short tone.) |
| TRACKER | 1.62s | A tracking signal (guess). |
| SCRSHOT | 0.69s | Screenshot taken. |
| LOGOMIX | 4.90s | The LucasArts logo. |
