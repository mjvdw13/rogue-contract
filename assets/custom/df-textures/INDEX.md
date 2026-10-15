# Dark Forces textures, by what they show

Every texture from the "MS-DOS - Star Wars_ Dark Forces - Miscellaneous -
Textures" pack (916 images), sorted into folders by what it shows
rather than by the level it came from. The level folders are listed for
each texture below. Read `../DISCLAIMER.md`: these are Lucasfilm's and
must not be redistributed.

- Names are Dark Forces' own, upper-case. The first letter is roughly the
  level or set (Z generic, I Imperial, N Nar Shaddaa, G Gromas, J Jabba's
  ship, R Robotics, S Sewers, T Talay); the second is what DF
  used it for (W wall, P floor or ceiling, D door, A animated, M
  see-through middle, S sign, C ceiling, F floor, E sky).
- Animation frames are `NAME_0`, `NAME_1` and so on, kept together.
- See-through pixels are transparent (alpha 0).
- Gromas recolours some generic textures in its own rusty palette; those
  are `NAME_GROMAS` beside the generic `NAME`.
- `ZCSQUAR1` comes in the pack's two versions, `_DEFAULT` and
  `_INTENDED`.
- `textures.mjs` finds textures here by name, whatever the folder.

| Folder | Count | What's in it |
| --- | ---: | --- |
| [3d-models](#3d-models) | 6 | Skins for Dark Forces' 3D objects (TIE fighter wings, engines). |
| [computers-screens](#computers-screens) | 55 | Computer banks, consoles, monitors, displays and holograms, with their animation frames. |
| [crates](#crates) | 10 | Cargo crates and barrels. |
| [damaged](#damaged) | 24 | Walls and doors with blast holes, cracks and scorch marks (see-through where blown open). |
| [door-frames](#door-frames) | 29 | Door jambs, lintel strips and frames round doorways. |
| [doors](#doors) | 76 | Door panels, blast doors, hatches and gates. |
| [floors-ceilings](#floors-ceilings) | 149 | Floor plates, ceiling tiles, concrete and other flat surfaces. |
| [forcefields](#forcefields) | 4 | Force fields and shields. |
| [grates-bars](#grates-bars) | 37 | Grates, grilles, vents, mesh, bars and cages (many see-through). |
| [hazard-stripes](#hazard-stripes) | 21 | Walls and floors mostly covered in warning stripes and chevrons. |
| [lifts](#lifts) | 5 | Elevator walls and platforms. |
| [lights](#lights) | 55 | Light panels, lamps, light strips and beacons. |
| [liquids](#liquids) | 5 | Water, acid and sewage. |
| [machinery](#machinery) | 83 | Pipes, ducts, tanks, engines, fans, conveyors and gears. |
| [natural](#natural) | 19 | Rock, cliff, dirt, grass, ice and snow. |
| [other](#other) | 5 | Fills, placeholders and a pile of debris. |
| [ships](#ships) | 7 | Ship hulls and engines, seen from outside. |
| [signs-insignia](#signs-insignia) | 28 | Imperial and Rebel crests, signs, graffiti, banners and reliefs. |
| [sky](#sky) | 11 | Sky and backdrop images. |
| [stone-brick](#stone-brick) | 28 | Marble, granite, stone and brick. |
| [switches-keys](#switches-keys) | 37 | Wall switches (`_0` off, `_1` on), key slots and small control panels. |
| [trims-strips](#trims-strips) | 26 | Narrow strips, edges, columns and ledges. |
| [walls](#walls) | 189 | Wall panelling: Imperial, industrial, city and ship interiors. |
| [windows](#windows) | 7 | Windows and portholes. |

## 3d-models

| Texture | Size | From |
| --- | --- | --- |
| ENGSTEXT | 16x32 | 3D Models |
| ENGTEXTS | 32x64 | 3D Models |
| SIDETEXT | 256x64 | 3D Models |
| TIEWNG | 128x128 | 3D Models |
| TIEWNG2 | 128x128 | Avenger (NightDive) |
| TOPTEXTS | 128x16 | 3D Models |

## computers-screens

| Texture | Size | From |
| --- | --- | --- |
| HOLOGRAM | 64x64 | SecBase |
| IPBRIDGE | 64x64 | Ramshed |
| IPDETPNL | 64x64 | SecBase |
| IPMONTRS | 64x64 | SecBase |
| IW8DIGIT | 32x128 | TestBase |
| IWASEQUE | 64x256 | Arc |
| IWCOMBLO | 64x128 | ImpCity |
| IWCOMWAL | 64x128 | ImpCity |
| IWDETPNL | 64x64 | Avenger (NightDive) |
| IWDTCHRT | 64x64 | Dtention |
| IWFRAME1 | 128x32 | SecBase |
| IWFRAME2 | 128x32 | SecBase |
| IWFUEL8 | 64x128 | TestBase |
| IWFUELS | 64x128 | FuelStat |
| IWMNTRS | 64x128 | SecBase |
| IWPANEL1 | 128x64 | SecBase |
| IWPANEL2 | 128x64 | SecBase |
| IWPANEL3 | 128x64 | SecBase |
| IWRAM2 | 128x128 | Ramshed |
| IWRAM5 | 128x128 | Ramshed |
| IWRAM6 | 128x128 | Ramshed |
| IWRAMGL1 | 64x64 | Ramshed |
| IWRAMGL2 | 64x64 | Ramshed |
| IWRAMON1 | 64x64 | Ramshed |
| IWRAMON2 | 128x64 | Ramshed |
| IWRAMON3 | 64x64 | Ramshed |
| NWTV1 | 64x128 | NarShada |
| NWTV2 | 64x128 | NarShada |
| NWTV3 | 64x256 | NarShada |
| RWSEQUEN | 64x512 | Robotics |
| SWCNTROL | 128x64 | Sewers |
| TPCOMP2 | 64x64 | Talay |
| TWCOMP2D | 64x128 | Talay |
| ZACOMP1_0 | 32x16 | Generic |
| ZACOMP1_1 | 32x16 | Generic |
| ZACOMP1_2 | 32x16 | Generic |
| ZACOMP1_3 | 32x16 | Generic |
| ZACOMP1_4 | 32x16 | Generic |
| ZACOMP1_5 | 32x16 | Generic |
| ZACOMP1_6 | 32x16 | Generic |
| ZACOMP1_7 | 32x16 | Generic |
| ZACOMP1_8 | 32x16 | Generic |
| ZACOMP1_9 | 32x16 | Generic |
| ZAEYE_0 | 32x32 | Generic |
| ZAEYE_1 | 32x32 | Generic |
| ZANAV_0 | 64x64 | Generic |
| ZANAV_1 | 64x64 | Generic |
| ZANAV_2 | 64x64 | Generic |
| ZANAV_3 | 64x64 | Generic |
| ZANAV_4 | 64x64 | Generic |
| ZANAV_5 | 64x64 | Generic |
| ZW4WAY | 32x128 | Generic |
| ZWCOMP1 | 64x64 | Generic |
| ZWMAZE | 128x128 | Generic |
| ZWNAVSW | 64x64 | Generic |

## crates

| Texture | Size | From |
| --- | --- | --- |
| IPRAMBLT | 64x64 | Ramshed |
| IPRMCRT1 | 64x64 | Ramshed |
| IPRMCRT2 | 64x64 | Ramshed |
| IPRMCRT3 | 64x64 | Ramshed |
| IPRMCRT4 | 64x64 | Ramshed |
| IPRMCRT5 | 64x64 | Ramshed |
| IPRMCRT6 | 64x64 | Ramshed |
| IPRMCRT7 | 64x64 | Ramshed |
| IPRMCRT8 | 64x64 | Ramshed |
| IPRMCRT9 | 64x64 | Ramshed |

## damaged

| Texture | Size | From |
| --- | --- | --- |
| IDMGCRT2 | 64x64 | Ramshed |
| IDMGCRT3 | 64x64 | Ramshed |
| IDMGDCRT | 64x64 | Ramshed |
| IPSEC1B | 128x128 | SecBase |
| IWDMGED1 | 64x128 | Dtention |
| IWDMGED2 | 64x128 | Dtention |
| IWDMGED3 | 64x128 | Dtention |
| IWDMGED4 | 64x128 | Dtention |
| NDCORUG2 | 128x128 | NarShada |
| TWCAP08 | 256x256 | Talay |
| TWDTOP1 | 64x64 | Talay |
| TWEXT01A | 128x128 | Talay |
| TWEXT01B | 128x128 | Talay |
| TWEXT05A | 64x128 | Talay |
| TWEXT05B | 64x128 | Talay |
| TWEXT05C | 128x128 | Talay |
| TWEXT06B | 64x128 | Talay |
| TWEXT06D | 128x128 | Talay |
| TWINT08A | 64x128 | Talay |
| TWINT08B | 64x128 | Talay |
| TWINT09A | 64x128 | Talay |
| TWINT09B | 64x128 | Talay |
| TWINT12A | 128x128 | Talay |
| TWINT12B | 128x128 | Talay |

## door-frames

| Texture | Size | From |
| --- | --- | --- |
| GDJAML1Y | 16x128 | Gromas |
| GDJMIN1Y | 16x64 | Gromas |
| GDJMIN2Y | 16x64 | Gromas |
| ICJAMLRX | 64x64 | Dtention |
| IDGROOVE | 8x2 | SecBase |
| IDJAMLCX | 64x64 | SecBase |
| IDJAMLCY | 64x64 | SecBase |
| IDJAMLRD | 32x8 | Executor |
| IDJAMLW | 32x8 | Executor |
| IDJAMPNL | 32x64 | TestBase |
| IPJAMLRX | 64x64 | SecBase |
| IPJAMLRY | 64x64 | SecBase |
| NDJAMS1Y | 16x64 | NarShada |
| NDJAMS2X | 64x16 | NarShada |
| NDJAMS2Y | 16x64 | NarShada |
| RDJAML1Y | 16x128 | Robotics |
| RDREDJX | 64x64 | Robotics |
| RDREDJY | 64x64 | Robotics |
| SDJAM1Y | 16x64 | Sewers |
| SDJAMLRG | 16x128 | Sewers |
| SDROUNDM | 64x64 | Sewers |
| SDROUNDT | 64x8 | Sewers |
| ZDJAML1Y | 16x128 | Generic |
| ZDJAML2Y | 16x128 | Generic |
| ZDJAML3Y | 16x128 | Generic |
| ZDJAMS2Y | 16x64 | Generic |
| ZDJAMSM1 | 16x64 | Generic |
| ZDJAMSM1_GROMAS | 16x64 | Gromas/Generic (Gromas) |
| ZDJMIN1X | 64x64 | Generic |

## doors

| Texture | Size | From |
| --- | --- | --- |
| GDMINESM | 64x64 | Gromas |
| ID24X16 | 256x128 | Dtention |
| ID8X8 | 64x64 | TestBase |
| IDALONG1 | 64x128 | Arc |
| IDASMAL1 | 64x64 | Executor |
| IDASMAL2 | 64x64 | Arc |
| IDASMAL3 | 64x64 | Arc |
| IDBLKDOR | 128x128 | Ramshed |
| IDCMPCTR | 64x128 | Dtention |
| IDDET | 64x256 | TestBase |
| IDDET1 | 64x64 | Dtention |
| IDDOOR1 | 64x64 | SecBase |
| IDDTENTW | 128x128 | Dtention |
| IDFUEL1 | 64x128 | SecBase |
| IDFUEL2 | 64x128 | SecBase |
| IDHATCH1 | 64x32 | Dtention |
| IDHATCH2 | 64x32 | Dtention |
| IDISO | 128x256 | ImpCity |
| IDLOGOGN | 128x128 | TestBase |
| IDMARBB1 | 64x64 | ImpCity |
| IDMARBY1 | 64x64 | ImpCity |
| IDSECB1 | 128x128 | SecBase |
| IDSECB2 | 64x64 | Ramshed |
| IDSECB3 | 128x64 | SecBase |
| IDSECBA | 64x64 | SecBase |
| IDSECBB | 64x64 | SecBase |
| IDSECBC | 64x64 | SecBase |
| IDTSTB1 | 64x64 | TestBase |
| IWAVGEXT | 128x256 | Dtention |
| IWBLKHED | 128x128 | Ramshed |
| IWTALL1 | 128x256 | Executor |
| JDBIGDR1 | 128x128 | JabShip |
| JDDOOR1 | 64x64 | JabShip |
| JDDOOR2 | 64x64 | JabShip |
| JDLILDR1 | 128x64 | JabShip |
| JDLILDR2 | 128x64 | JabShip |
| NDBROWN | 64x64 | NarShada |
| NDCORUG1 | 128x128 | NarShada |
| NDLIGHT | 64x64 | NarShada |
| NDPIPES4 | 128x128 | NarShada |
| NDREDOTS | 64x64 | NarShada |
| NDSTRONG | 64x64 | NarShada |
| NDWARN7 | 128x128 | NarShada |
| RDBIG2 | 128x128 | Robotics |
| RDBIG4 | 128x128 | Robotics |
| RDRED01 | 64x64 | Robotics |
| RDRED02 | 64x128 | Robotics |
| RDRED03 | 64x64 | Robotics |
| RDRED04 | 128x64 | Robotics |
| RDTUBE | 128x128 | Robotics |
| SDGATE1 | 64x64 | Sewers |
| SDGRATE1 | 64x64 | Sewers |
| TDBIGDR4 | 128x128 | Talay |
| ZDARMOR2 | 64x64 | Generic |
| ZDARMOR3 | 64x64 | Generic |
| ZDARMOR4 | 64x64 | Generic |
| ZDARMOR4_GROMAS | 64x64 | Gromas/Generic (Gromas) |
| ZDBIGDR1 | 128x128 | Generic |
| ZDBIGDR2 | 128x128 | Generic |
| ZDBIGDR3 | 128x128 | Generic |
| ZDBIGDR4 | 128x128 | Generic |
| ZDEXT1 | 64x64 | Generic |
| ZDILOGO1 | 128x128 | Generic |
| ZDIMPER1 | 64x64 | Generic |
| ZDIMPER4 | 128x128 | Generic |
| ZDIMPER5 | 128x128 | Generic |
| ZDIMPLG4 | 128x128 | Generic |
| ZDIND1 | 64x64 | Generic |
| ZDMETAL1 | 64x64 | Generic |
| ZDMINEBG | 128x128 | Generic |
| ZDMINEBG_GROMAS | 128x128 | Gromas/Generic (Gromas) |
| ZDREBL1 | 64x64 | Generic |
| ZDREBL2 | 64x64 | Generic |
| ZDREBL3 | 64x64 | Generic |
| ZDREBLT1 | 64x64 | Generic |
| ZDROBDR1 | 128x64 | Generic |

## floors-ceilings

| Texture | Size | From |
| --- | --- | --- |
| CPCARPT1 | 64x64 | Talay |
| GMASK | 64x64 | Gromas |
| GPMINE02 | 64x64 | Gromas |
| GPMINE1X | 64x64 | Gromas |
| GPMINE2Y | 64x64 | Gromas |
| GPMINE5 | 64x64 | Gromas |
| GPMINE6 | 64x64 | Gromas |
| GPPIPES7 | 64x64 | Gromas |
| ICDET6 | 64x64 | Dtention |
| ICDETSQR | 64x64 | Avenger (NightDive) |
| ICFUEL1 | 64x64 | SecBase |
| IF1 | 64x64 | SecBase |
| IF2 | 64x64 | SecBase |
| IF3 | 64x64 | SecBase |
| IFDSHDOW | 64x64 | Dtention |
| IFFUEL1 | 64x64 | Ramshed |
| IPADARK3 | 64x64 | Arc |
| IPADARK4 | 64x64 | Arc |
| IPADARK6 | 64x64 | Arc |
| IPAFLOR1 | 64x64 | FuelStat |
| IPCOMSLT | 64x64 | TestBase |
| IPCOMTOP | 64x64 | ImpCity |
| IPDET1 | 64x64 | TestBase |
| IPDETEL2 | 64x64 | SecBase |
| IPDETSQR | 64x64 | Dtention |
| IPDTENBL | 64x64 | SecBase |
| IPDTENGR | 64x64 | SecBase |
| IPDUCTG | 64x64 | SecBase |
| IPEXFLR | 64x64 | Ramshed |
| IPEXFLR2 | 64x64 | Executor |
| IPEXFLR3 | 64x64 | Executor |
| IPGRDBLX | 64x64 | TestBase |
| IPGRDBLY | 64x64 | Executor |
| IPGRDGRY | 64x64 | Arc |
| IPGREYC2 | 64x64 | Arc |
| IPHANGR1 | 64x64 | Executor |
| IPOCTGR | 64x64 | Dtention |
| IPOVAL | 32x16 | Executor |
| IPOVAL2 | 64x64 | Executor |
| IPPOOLBL | 64x64 | FuelStat |
| IPPOOLGR | 64x64 | SecBase |
| IPRAM1 | 64x64 | Ramshed |
| IPRAM3 | 64x64 | Ramshed |
| IPRECTGR | 64x64 | SecBase |
| IPSEC1 | 64x64 | SecBase |
| IPSEC3 | 64x64 | SecBase |
| IPSQUAR1 | 64x64 | SecBase |
| IPSTGRID | 64x64 | Dtention |
| IPTSTB1 | 64x64 | Ramshed |
| IPTSTB2 | 64x64 | TestBase |
| IPTSTB3 | 64x64 | TestBase |
| IPTSTB5 | 64x64 | TestBase |
| JPBLLT | 64x64 | JabShip |
| JPCIRCL1 | 64x64 | JabShip |
| JPCIRCL2 | 64x64 | JabShip |
| JPCOMB5 | 64x64 | JabShip |
| JPDIMON1 | 64x64 | JabShip |
| JPLINES1 | 64x64 | JabShip |
| JPLINES2 | 64x64 | JabShip |
| JPLINES3 | 64x64 | JabShip |
| JPSQUAR1 | 64x64 | JabShip |
| NPBRN02 | 64x64 | NarShada |
| NPBRN04 | 64x64 | NarShada |
| NPBRN05 | 64x64 | NarShada |
| NPGREY01 | 64x64 | NarShada |
| NPGREY02 | 64x64 | NarShada |
| NPGRYBAR | 64x64 | NarShada |
| NPGRYLT | 64x64 | NarShada |
| NPPANEL1 | 64x64 | NarShada |
| NPSUPORT | 64x64 | NarShada |
| RPIBEAM | 64x64 | Robotics |
| RPIBEAM2 | 64x64 | Robotics |
| RPMIXTOP | 64x64 | Robotics |
| RPURINE1 | 64x64 | Robotics |
| SPCMENT1 | 64x64 | Sewers |
| SPCMENT2 | 64x64 | Sewers |
| SPDRAIN1 | 64x64 | Sewers |
| SPMETAL1 | 64x64 | Sewers |
| SPSTRIPX | 64x64 | Sewers |
| SPSTRIPY | 64x64 | Sewers |
| TPDIMNDY | 64x64 | Talay |
| TPGREY1 | 64x64 | Talay |
| ZCGRECTY | 64x64 | Avenger (NightDive) |
| ZCIND4L | 64x64 | Avenger (NightDive) |
| ZCSQUAR1_DEFAULT | 64x64 | Avenger (NightDive) |
| ZCSQUAR1_INTENDED | 64x64 | Avenger (NightDive) |
| ZFBGGRID | 64x64 | Generic |
| ZFBGRID2 | 64x64 | Generic |
| ZPBLACK1 | 64x64 | Generic |
| ZPBLACK2 | 64x64 | Generic |
| ZPBOLTD1 | 64x64 | Generic |
| ZPCIRCL1 | 64x64 | Generic |
| ZPCIRCL2 | 64x64 | Generic |
| ZPCMENT1 | 64x64 | Generic |
| ZPCMENT2 | 64x64 | Generic |
| ZPCMENT6 | 64x64 | Generic |
| ZPDIAGS1 | 64x64 | Generic |
| ZPDIAGS2 | 64x64 | Generic |
| ZPDIMNDX | 64x64 | Generic |
| ZPGRDGRY | 64x64 | Generic |
| ZPGREY | 64x64 | Generic |
| ZPGREY2 | 64x64 | Generic |
| ZPGROMS1 | 64x64 | Generic |
| ZPGROMS1_GROMAS | 64x64 | Gromas/Generic (Gromas) |
| ZPGRSPAT | 64x64 | Generic |
| ZPHTEC2 | 64x64 | Generic |
| ZPHTEC3 | 64x64 | Generic |
| ZPHTECX | 64x64 | Generic |
| ZPHTECY | 64x64 | Generic |
| ZPHTECZ1 | 64x64 | Generic |
| ZPIND1 | 64x64 | Generic |
| ZPIND3 | 64x64 | Generic |
| ZPINT19 | 64x64 | Generic |
| ZPINT20 | 64x64 | Generic |
| ZPINT21X | 64x64 | Generic |
| ZPJABPA1 | 64x64 | JabShip |
| ZPJABPI4 | 64x64 | JabShip |
| ZPMAT | 64x64 | Generic |
| ZPPANEL1 | 64x64 | Generic |
| ZPPANEL3 | 64x64 | Generic |
| ZPPOOLG1 | 64x64 | Generic |
| ZPPOOLG2 | 64x64 | Generic |
| ZPPOOLG4 | 64x64 | Generic |
| ZPPOOLG5 | 64x64 | Generic |
| ZPPOOLWT | 64x64 | Generic |
| ZPRIVET1 | 64x64 | Generic |
| ZPSEWRL1 | 64x64 | Sewers |
| ZPSEWRL3 | 64x64 | Sewers |
| ZPSEWRL4 | 64x64 | Sewers |
| ZPSEWRL6 | 64x64 | Sewers |
| ZPSHINY1 | 64x64 | Generic |
| ZPSIMP06 | 64x64 | Generic |
| ZPSIMP09 | 64x64 | Generic |
| ZPSIMP11 | 64x64 | Generic |
| ZPSIMP12 | 64x64 | Generic |
| ZPSLOT1Y | 64x64 | Generic |
| ZPSLOT2Y | 64x64 | Generic |
| ZPSLOT2Y_GROMAS | 64x64 | Gromas/Generic (Gromas) |
| ZPSLOT3X | 64x64 | Generic |
| ZPSLOT3Y | 64x64 | Generic |
| ZPSLOT4X | 64x64 | Generic |
| ZPSLOT6X | 64x64 | Generic |
| ZPSLOT6Y | 64x64 | Generic |
| ZPSLOT7Y | 64x64 | Generic |
| ZPSPATBL | 64x64 | Generic |
| ZPSPATGR | 64x64 | Generic |
| ZPTILE3 | 64x64 | Generic |
| ZPTILE4 | 64x64 | Generic |
| ZPWHTLIT | 64x64 | Generic |

## forcefields

| Texture | Size | From |
| --- | --- | --- |
| IDSHLDLX | 64x64 | FuelStat |
| IDSHLDLY | 64x64 | Executor |
| IFORCFLD | 64x64 | Dtention |
| IFRCFLD2 | 64x64 | Dtention |

## grates-bars

| Texture | Size | From |
| --- | --- | --- |
| GPGRIDSM | 64x64 | Gromas/Generic (Gromas), Gromas |
| ICDELEV | 64x64 | Arc |
| IMGATEY | 64x64 | Avenger (NightDive) |
| IPAGRD1Y | 64x64 | Arc |
| IPAGRD2 | 64x64 | Arc |
| IPAGRD3X | 64x64 | Arc |
| IPDUCTC | 64x64 | TestBase |
| IPGATE1Y | 64x64 | Executor |
| IPRAM4 | 64x64 | Ramshed |
| NPVENTS1 | 64x64 | NarShada |
| NPVENTS2 | 64x64 | NarShada |
| RPGRIDDK | 64x64 | Robotics |
| RPGRIDMD | 64x64 | Robotics |
| SPBARS1 | 64x64 | Sewers |
| SPBARS2 | 64x64 | Sewers |
| SPBARS3 | 64x64 | Sewers |
| SPGRATE1 | 64x64 | Sewers |
| SWREBAR2 | 128x64 | Sewers |
| ZMGRATE1 | 64x64 | Generic |
| ZMJABMD1 | 16x64 | Generic, JabShip |
| ZPBOLTD3 | 64x64 | Generic |
| ZPCRUNFL | 64x64 | Generic |
| ZPGRTE1X | 64x64 | Generic |
| ZPGRTE1Y | 64x64 | Generic |
| ZPGRTE2Y | 64x64 | Generic |
| ZPGRTE3X | 64x64 | Generic |
| ZPGRTE3Y | 64x64 | Generic |
| ZPGRTE4Y | 64x64 | Generic |
| ZPGRTE4Y_GROMAS | 64x64 | Gromas/Generic (Gromas) |
| ZPGRTE5Y | 64x64 | Generic |
| ZPGRTE6Y | 64x64 | Generic |
| ZPGRTE8 | 64x64 | Generic |
| ZPJABMES | 64x64 | JabShip |
| ZPSGRTE1 | 64x64 | Sewers |
| ZSPANEL1 | 32x32 | Generic |
| ZWBARS | 16x32 | Generic |
| ZWDKBARS | 32x128 | Generic |

## hazard-stripes

| Texture | Size | From |
| --- | --- | --- |
| GPZIGZ1X | 64x64 | Gromas |
| GPZIGZ1Y | 64x64 | Gromas |
| GPZIGZ2X | 64x64 | Gromas |
| GPZIGZ2Y | 64x64 | Gromas |
| GPZIGZ3X | 64x64 | Gromas |
| GPZIGZ3Y | 64x64 | Gromas |
| GPZIGZ4X | 64x64 | Gromas |
| GPZIGZ4Y | 64x64 | Gromas |
| GWSTRIPE | 32x64 | Gromas |
| IWACONV1 | 64x128 | Arc |
| IWACONV2 | 64x128 | Arc |
| IWACONV3 | 64x128 | Arc |
| IWACONV4 | 64x128 | Arc |
| IWARED0 | 32x128 | Arc |
| IWARED4 | 64x128 | Arc |
| NPWRNFAD | 64x64 | NarShada |
| NWWARN1 | 64x128 | NarShada |
| NWWARN2 | 64x128 | NarShada |
| NWWARN4 | 64x128 | NarShada |
| NWWARN4L | 32x128 | NarShada |
| NWWARN4R | 32x128 | NarShada |

## lifts

| Texture | Size | From |
| --- | --- | --- |
| IPEXELV | 64x64 | TestBase |
| IWDETEL3 | 64x128 | Dtention |
| IWDETELV | 128x128 | Dtention |
| IWRAMELV | 64x64 | Ramshed |
| JPELEV1Y | 64x64 | JabShip |

## lights

| Texture | Size | From |
| --- | --- | --- |
| IPALITE0 | 64x64 | Arc |
| IPALITE1 | 64x64 | Executor |
| IPALITE2 | 64x64 | Arc |
| IPALITE3 | 64x64 | Arc |
| IPBIGLT | 64x64 | Executor |
| IPDTENRD | 64x64 | SecBase |
| IPEXCEIL | 64x64 | Executor |
| IPRAM2 | 64x64 | Ramshed |
| IPSQAR2 | 64x64 | SecBase |
| IPTSTB4 | 64x64 | TestBase |
| IWLITE | 16x32 | Executor |
| IWRDBL | 16x32 | Executor |
| IWRISER | 16x8 | TestBase |
| IWURB3 | 128x256 | ImpCity |
| NPLIT1 | 64x64 | NarShada |
| NPLIT4 | 64x64 | NarShada |
| NPLIT4SH | 64x64 | NarShada |
| NWBEVEL5 | 64x128 | NarShada |
| SALTBULB | 64x128 | Sewers |
| TWILIT01 | 128x128 | Talay |
| ZASPIN_0 | 64x64 | Generic |
| ZASPIN_1 | 64x64 | Generic |
| ZASPIN_2 | 64x64 | Generic |
| ZASPIN_3 | 64x64 | Generic |
| ZASPIN_4 | 64x64 | Generic |
| ZASPIN_5 | 64x64 | Generic |
| ZASPIN_6 | 64x64 | Generic |
| ZPLBLU1X | 64x64 | Generic |
| ZPLBLU2Y | 64x64 | Generic |
| ZPLIT01X | 64x64 | Generic |
| ZPLIT01Y | 64x64 | Generic |
| ZPLIT03X | 64x64 | Generic |
| ZPLIT03Y | 64x64 | Generic |
| ZPLIT04 | 64x64 | Generic |
| ZPLIT06 | 64x64 | Generic |
| ZPLIT08 | 64x64 | Generic |
| ZPLIT08D | 64x64 | Generic |
| ZPLIT09 | 64x64 | Generic |
| ZPLIT10 | 64x64 | Generic |
| ZPLIT15 | 64x64 | Generic |
| ZSLTSTR1 | 64x8 | Generic |
| ZSLTSTR2 | 64x8 | Generic |
| ZWGRENL1 | 32x128 | Generic |
| ZWHALL1L | 64x128 | Generic |
| ZWHALL2L | 32x128 | Generic |
| ZWILIT01 | 32x128 | Generic |
| ZWILIT03 | 32x128 | Generic |
| ZWILIT06 | 64x128 | Generic |
| ZWILIT08 | 64x128 | Generic |
| ZWILIT12 | 64x128 | Generic |
| ZWILIT14 | 64x128 | Generic |
| ZWILIT18 | 32x128 | Generic |
| ZWLIT03X | 32x32 | Generic |
| ZWLYSM | 64x128 | Generic |
| ZWOVAL1Y | 64x128 | Generic |

## liquids

| Texture | Size | From |
| --- | --- | --- |
| CFWATER4 | 64x64 | Talay |
| RPACID01 | 64x64 | Robotics |
| SPSEWGE1 | 64x64 | Sewers |
| SPSEWGE2 | 64x64 | Sewers |
| SPSEWGE3 | 64x64 | Sewers |

## machinery

| Texture | Size | From |
| --- | --- | --- |
| GWDRILL1 | 32x128 | Gromas |
| GWDRILL4 | 32x128 | Gromas |
| GWDRILL5 | 128x128 | Gromas |
| GWPIPES1 | 64x128 | Gromas |
| GWPIPES2 | 128x128 | Gromas |
| GWPIPES3 | 64x128 | Gromas |
| GWPIPES4 | 128x128 | Gromas |
| GWPIPES5 | 32x128 | Gromas |
| GWPIPES6 | 256x128 | Gromas |
| GWPIPES7 | 64x128 | Gromas |
| GWPIPES8 | 128x128 | Gromas |
| IAFAN | 64x128 | Dtention |
| IAFANSH | 64x128 | Dtention |
| IFDUCT | 64x64 | Avenger (NightDive) |
| IPACONVX | 64x64 | Arc |
| IPACONVY | 64x64 | Arc |
| IPATEC1 | 64x64 | Arc |
| IPATEC3Y | 64x64 | Dtention |
| IPATEC4Y | 64x64 | Arc |
| IPATEC5Y | 64x64 | Arc |
| IPCUPLER | 128x128 | Arc |
| IPDETPIP | 64x64 | SecBase |
| IPPIPEX | 64x64 | Dtention |
| IPPIPEY | 64x64 | SecBase |
| IWAPIPE1 | 128x128 | Arc |
| IWAPIPE2 | 128x128 | Arc |
| IWAPIPE3 | 128x128 | Arc |
| IWAPIPE4 | 256x128 | Arc |
| IWAPIPE5 | 64x128 | Arc |
| IWAPIPE6 | 128x128 | Arc |
| IWAPIST1 | 256x128 | Arc |
| IWARC1 | 128x128 | Arc |
| IWATEC3 | 64x128 | Executor |
| IWBGPIPE | 128x128 | Dtention |
| IWDUCTR | 64x64 | Avenger (NightDive) |
| IWFTANK | 128x256 | FuelStat |
| IWFUEL1 | 128x128 | FuelStat |
| IWFUEL2 | 128x128 | FuelStat |
| IWFUEL3 | 64x128 | FuelStat |
| IWFUEL4 | 64x128 | FuelStat |
| IWFUEL7 | 64x128 | FuelStat |
| IWFUEL9 | 128x128 | FuelStat |
| IWLIFTER | 128x256 | Executor |
| IWRCPORT | 128x128 | Executor |
| JPMACH1 | 64x64 | JabShip |
| NPBPIPE1 | 64x64 | NarShada |
| NPBPIPE2 | 64x64 | NarShada |
| NPPIPES1 | 64x64 | NarShada |
| NPPIPES2 | 64x64 | NarShada |
| NWBPIPE2 | 128x128 | NarShada |
| NWBPIPE3 | 128x128 | NarShada |
| NWPIPES2 | 128x128 | NarShada |
| RPCONVBX | 64x64 | Robotics |
| RPCONVBY | 64x64 | Robotics |
| RWBIGGO | 128x256 | Robotics |
| RWCONV1L | 64x128 | Robotics |
| RWFAN | 512x64 | Robotics |
| RWGEARS | 64x128 | Robotics |
| RWMIXER1 | 128x256 | Robotics |
| ZPGPIPE1 | 64x64 | Generic |
| ZPGPIPE2 | 64x64 | Generic |
| ZPGPIPE3 | 64x64 | Generic |
| ZPGPIPE3_GROMAS | 64x64 | Gromas/Generic (Gromas) |
| ZPGPIPE4 | 64x64 | Generic |
| ZPGPIPE4_GROMAS | 64x64 | Gromas/Generic (Gromas) |
| ZPGREYP1 | 64x64 | Generic |
| ZPJABPI1 | 64x64 | JabShip |
| ZPJABPI2 | 64x64 | JabShip |
| ZPJABPI3 | 64x64 | JabShip |
| ZPTUBECX | 64x64 | Generic |
| ZPTUBECY | 64x64 | Generic |
| ZPTUBEFX | 64x64 | Generic |
| ZPTUBEFY | 64x64 | Generic |
| ZPVEINED | 64x64 | Generic |
| ZWBRIDGE | 128x128 | Generic |
| ZWCOUPL1 | 128x256 | Generic |
| ZWCOUPL2 | 128x128 | Generic |
| ZWCRUNCH | 64x128 | Generic |
| ZWGASTNK | 64x64 | Generic |
| ZWPIPES1 | 64x128 | Generic |
| ZWPIPES2 | 128x64 | Generic |
| ZWTUBE | 32x128 | Generic |
| ZWTUBEND | 128x128 | Generic |

## natural

| Texture | Size | From |
| --- | --- | --- |
| GPDIRTDK | 64x64 | Gromas |
| GPDIRTRD | 64x64 | Gromas |
| GWBIGCLF | 128x512 | Gromas |
| GWDIRTDK | 128x64 | Gromas |
| GWDIRTLT | 128x64 | Gromas |
| GWDIRTMD | 128x64 | Gromas |
| RFICE01 | 64x64 | Robotics |
| RFICYDAG | 64x64 | Robotics |
| RFICYEW | 64x64 | Robotics |
| RPICE02 | 64x64 | Robotics |
| RPSNOW3 | 64x64 | Robotics |
| RWICE01 | 128x128 | Robotics |
| RWICEFAL | 64x128 | Robotics |
| ZPDIRT01 | 64x64 | Generic |
| ZPDIRT01_GROMAS | 64x64 | Gromas/Generic (Gromas) |
| ZPGRASS3 | 64x64 | Generic |
| ZPROCK02 | 64x64 | Generic |
| ZWCLIFLT | 128x128 | Generic |
| ZWCLIFMD | 128x128 | Generic |

## other

| Texture | Size | From |
| --- | --- | --- |
| DEFAULT | 64x64 | Generic |
| IPTRSHC1 | 64x64 | TestBase |
| WHFILL | 4x4 | Generic |
| ZPGRYFIL | 1x1 | Generic |
| ZPYFILL | 1x1 | Generic |

## ships

| Texture | Size | From |
| --- | --- | --- |
| IPSDENGN | 128x128 | Ramshed |
| IWABGWHT | 256x128 | Ramshed |
| IWENGBAC | 256x128 | Ramshed |
| IWENGSID | 512x128 | Ramshed |
| IWSHIP0 | 512x128 | Ramshed |
| JWSHPEXT | 256x128 | JabShip |
| ZWJABEXT | 256x128 | JabShip |

## signs-insignia

| Texture | Size | From |
| --- | --- | --- |
| IDLOGORD | 256x256 | Executor |
| JWPIGHED | 64x128 | JabShip |
| JWRELIEF | 256x128 | JabShip |
| NSSIGN01 | 64x64 | NarShada |
| NSSIGN03 | 64x64 | NarShada |
| NSSIGN04 | 64x64 | NarShada |
| NSSIGN05 | 32x64 | NarShada |
| NSSIGN06 | 32x32 | NarShada |
| NSSIGN07 | 32x32 | NarShada |
| NSSIGN09 | 32x32 | NarShada |
| NSSIGN10 | 32x32 | NarShada |
| NWEXT07D | 256x128 | NarShada |
| NWEXT08D | 256x128 | NarShada |
| RPDANGR2 | 32x64 | Robotics |
| ZPMARBWF | 64x64 | Generic |
| ZSBANNLG | 64x128 | Generic |
| ZSBLK-A | 32x32 | Generic |
| ZSBLK-B | 32x32 | Generic |
| ZSBLK-C | 32x32 | Generic |
| ZSBLK-D | 32x32 | Generic |
| ZSBLK-E | 32x32 | Generic |
| ZSBLK-F | 32x32 | Generic |
| ZSREBEL3 | 64x64 | Generic |
| ZWILOGO2 | 256x128 | Generic |
| ZWILOGO6 | 128x128 | Generic |
| ZWMARBG1 | 128x128 | Generic |
| ZWMARBG2 | 128x128 | Generic |
| ZWMARBY5 | 128x128 | Generic |

## sky

| Texture | Size | From |
| --- | --- | --- |
| CESUNSET | 256x256 | Talay |
| GEGROSKY | 128x256 | Gromas |
| IEDETSKY | 256x256 | Dtention |
| IERAMSKY | 256x256 | Ramshed |
| IESTARS | 128x128 | NarShada |
| IETSTSKY | 256x256 | TestBase |
| ISECBSKY | 256x256 | SecBase |
| NENARSKY | 256x512 | NarShada |
| RESKY01 | 128x256 | Robotics |
| RESKY02 | 128x256 | Robotics |
| SESEWSKY | 256x256 | Sewers |

## stone-brick

| Texture | Size | From |
| --- | --- | --- |
| IWGRAN5 | 128x256 | TestBase |
| IWGRAN6 | 128x256 | TestBase |
| TPCRAKS1 | 64x64 | Talay |
| ZPBRICK1 | 64x64 | Generic |
| ZPBRICK2 | 64x64 | Generic |
| ZPBRICK3 | 64x64 | Generic |
| ZPMARBB1 | 64x64 | Generic |
| ZPMARBB2 | 64x64 | Generic |
| ZPMARBB3 | 64x64 | Generic |
| ZPMARBE2 | 64x64 | Generic |
| ZPMARBG3 | 64x64 | Generic |
| ZPMARBL1 | 64x64 | Generic |
| ZPMARBL2 | 64x64 | Generic |
| ZPMARBR2 | 64x64 | Generic |
| ZPMARBW2 | 64x64 | Generic |
| ZPMARBY1 | 64x64 | Generic |
| ZPSTONGR | 64x64 | Generic |
| ZWMARBB1 | 128x128 | Generic |
| ZWMARBB3 | 128x128 | Generic |
| ZWMARBW1 | 128x128 | Generic |
| ZWMARBW3 | 32x128 | Generic |
| ZWMARBY0 | 128x128 | Generic |
| ZWMARBY2 | 128x128 | Generic |
| ZWMARBY4 | 64x128 | Generic |
| ZWMARBY6 | 32x128 | Generic |
| ZWMARBY7 | 64x128 | Generic |
| ZWMARBY9 | 64x128 | Generic |
| ZWSTONEW | 128x128 | Generic |

## switches-keys

| Texture | Size | From |
| --- | --- | --- |
| IASWBLUE | 16x64 | Ramshed |
| IATRKDEV | 64x128 | Ramshed |
| IWELPANL | 16x32 | Dtention |
| NUM6-OFF | 32x32 | Generic |
| SWSWITCH | 32x128 | Sewers |
| ZASWIT00_0 | 32x32 | Generic |
| ZASWIT00_1 | 32x32 | Generic |
| ZASWIT01_0 | 32x32 | Generic |
| ZASWIT01_1 | 32x32 | Generic |
| ZASWIT02_0 | 32x32 | Generic |
| ZASWIT02_1 | 32x32 | Generic |
| ZASWIT03_0 | 32x16 | Generic |
| ZASWIT03_1 | 32x16 | Generic |
| ZASWIT04_0 | 16x32 | Generic |
| ZASWIT04_1 | 16x32 | Generic |
| ZASWIT04G_0 | 16x32 | Gromas/Generic (Gromas) |
| ZASWIT04G_1 | 16x32 | Gromas/Generic (Gromas) |
| ZASWIT05_0 | 16x32 | Generic |
| ZASWIT05_1 | 16x32 | Generic |
| ZASWIT06_0 | 32x32 | Generic |
| ZASWIT06_1 | 32x32 | Generic |
| ZASWIT07_0 | 32x32 | Generic |
| ZASWIT07_1 | 32x32 | Generic |
| ZASWIT08_0 | 32x64 | Generic |
| ZASWIT08_1 | 32x64 | Generic |
| ZASWIT09_0 | 32x32 | Generic |
| ZASWIT09_1 | 32x32 | Generic |
| ZASWIT10_0 | 32x32 | Generic |
| ZASWIT10_1 | 32x32 | Generic |
| ZASWIT11_0 | 16x64 | Generic |
| ZASWIT11_1 | 16x64 | Generic |
| ZASWIT12_0 | 32x32 | Generic |
| ZASWIT12_1 | 32x32 | Generic |
| ZASWIT14_0 | 32x32 | Generic |
| ZASWIT14_1 | 32x32 | Generic |
| ZSBLOCK | 8x32 | Avenger (NightDive) |
| ZSYLOCK | 8x32 | Avenger (NightDive) |

## trims-strips

| Texture | Size | From |
| --- | --- | --- |
| GWDRILL6 | 16x128 | Gromas |
| IWSTRIP | 32x64 | Arc |
| NWRISER | 64x16 | NarShada |
| RWACID02 | 64x512 | Robotics |
| RWCOLENR | 16x128 | Robotics |
| RWCOLUM1 | 32x128 | Robotics |
| RWCOLUM3 | 32x128 | Robotics |
| RWFANSWT | 64x1024 | Robotics |
| RWIBEAM1 | 64x512 | Robotics |
| RWRWALL1 | 32x128 | Robotics |
| RWRWALL2 | 32x128 | Robotics |
| SWWALKW1 | 64x16 | Sewers |
| SWWALKW2 | 64x32 | Sewers |
| ZWARCH1 | 32x128 | Generic |
| ZWBAND1 | 32x128 | Generic |
| ZWCARGP8 | 256x16 | Generic |
| ZWCSIDE | 64x16 | Generic |
| ZWGRUV1 | 32x128 | Generic |
| ZWSTRIP1 | 16x128 | Generic |
| ZWSTRIP2 | 16x128 | Generic |
| ZWSTRIP2_GROMAS | 16x128 | Gromas/Generic (Gromas) |
| ZWSTRIP3 | 8x64 | Generic |
| ZWSTRIP5 | 8x64 | Generic |
| ZWSTRIP6 | 64x16 | Generic |
| ZWSTRIP8 | 64x8 | Generic |
| ZWWHITE0 | 16x128 | Generic |

## walls

| Texture | Size | From |
| --- | --- | --- |
| GWANO | 256x512 | Gromas |
| GWBIGASS | 128x1024 | Gromas |
| GWMINE01 | 128x64 | Gromas |
| GWMINE02 | 128x64 | Gromas |
| GWMINE03 | 128x64 | Gromas |
| GWMINE06 | 64x128 | Gromas |
| IPCPAN2 | 64x256 | Ramshed |
| IPCPAN3 | 128x256 | Ramshed |
| IPCPAN8 | 256x256 | Ramshed |
| IWADARK1 | 64x128 | Arc |
| IWADARK3 | 64x128 | Arc |
| IWADARK4 | 64x128 | Arc |
| IWATEC4 | 32x128 | Ramshed |
| IWBGFUEL | 128x256 | FuelStat |
| IWBGFUL2 | 128x256 | FuelStat |
| IWBGFUL3 | 128x128 | Dtention |
| IWCMPCTR | 64x128 | Dtention |
| IWCOMSLT | 64x128 | ImpCity |
| IWDET1 | 64x128 | SecBase |
| IWDET10 | 128x128 | Dtention |
| IWDET2 | 64x128 | TestBase |
| IWDETAL2 | 64x128 | SecBase |
| IWDHUGEZ | 128x256 | SecBase |
| IWDKHALL | 64x128 | Dtention |
| IWDNLIT | 64x128 | Executor |
| IWDNLITI | 128x128 | Executor |
| IWDSHALL | 128x128 | SecBase |
| IWDSTALL | 64x256 | TestBase |
| IWDSTALL1 | 64x256 | TestBase |
| IWDTEN | 32x128 | SecBase |
| IWEX1 | 128x128 | TestBase |
| IWFUEL5 | 64x128 | FuelStat |
| IWGREYC2 | 128x128 | Dtention |
| IWLOGORD | 64x256 | SecBase |
| IWLOWCON | 64x128 | SecBase |
| IWNOLIT | 64x128 | SecBase |
| IWRAM1 | 128x256 | Ramshed |
| IWRAM3 | 64x128 | Ramshed |
| IWRAM4 | 64x128 | Ramshed |
| IWRAM7 | 32x128 | Ramshed |
| IWRAM8 | 32x128 | Ramshed |
| IWREACT1 | 128x128 | TestBase |
| IWSCONBL | 64x128 | Ramshed |
| IWSCONGR | 64x128 | Dtention |
| IWSECB2 | 64x128 | SecBase |
| IWSECB3 | 64x128 | SecBase |
| IWSECB4 | 64x128 | TestBase |
| IWSECB5 | 64x128 | SecBase |
| IWSECBS1 | 64x256 | SecBase |
| IWSHAFTX | 64x64 | Avenger (NightDive) |
| IWSHAFTY | 64x64 | Avenger (NightDive) |
| IWTALL2 | 64x256 | SecBase |
| IWTSTB1 | 256x128 | TestBase |
| IWTSTB2 | 64x256 | TestBase |
| IWTSTB4 | 64x128 | TestBase |
| IWTSTBRC | 128x256 | TestBase |
| IWURB1 | 128x256 | ImpCity |
| IWURB2 | 128x256 | ImpCity |
| IWWRHSE1 | 64x128 | SecBase |
| IWWRHSE2 | 64x128 | Avenger (NightDive) |
| JWBIG01 | 128x256 | JabShip |
| JWCIRCL1 | 64x128 | JabShip |
| JWCIRCL2 | 32x128 | JabShip |
| JWCIRCL3 | 32x128 | JabShip |
| JWCOLUMN | 64x128 | JabShip |
| JWCOMB1 | 64x128 | JabShip |
| JWCOMB2 | 32x128 | JabShip |
| JWCOMB3 | 32x128 | JabShip |
| JWCOMB4 | 64x128 | JabShip |
| JWFANCY2 | 128x64 | JabShip |
| JWGRATE1 | 64x128 | JabShip |
| JWPLAIN | 64x128 | JabShip |
| NWARCH1 | 64x128 | NarShada |
| NWARCH2 | 64x128 | NarShada |
| NWBEVEL1 | 32x128 | NarShada |
| NWBEVEL3 | 32x128 | NarShada |
| NWBEVEL4 | 32x128 | NarShada |
| NWBIGGIE | 256x512 | NarShada |
| NWBRACE | 128x128 | NarShada |
| NWBRN01L | 64x128 | NarShada |
| NWBRN02 | 64x128 | NarShada |
| NWBRN03L | 64x128 | NarShada |
| NWEXT01 | 128x128 | NarShada |
| NWEXT02 | 128x128 | NarShada |
| NWEXT06 | 128x128 | NarShada |
| NWEXT09 | 128x128 | NarShada |
| NWEXT2 | 128x128 | NarShada |
| NWGREY01 | 64x128 | NarShada |
| NWGREY02 | 64x128 | NarShada |
| NWGRN03 | 64x128 | NarShada |
| NWGRN06 | 128x128 | NarShada |
| NWGRN08 | 128x128 | NarShada |
| NWGRN09 | 128x128 | NarShada |
| NWGRN10 | 64x128 | NarShada |
| NWGRN12 | 64x128 | NarShada |
| NWNOTCH | 64x128 | NarShada |
| NWWHT01 | 128x128 | NarShada |
| RWCLEAN1 | 64x128 | Robotics |
| RWCLEAN2 | 32x128 | Robotics |
| RWCLEAN3 | 64x128 | Robotics |
| RWCOLTEC | 128x128 | Robotics |
| RWEXTI01 | 64x128 | Robotics |
| RWEXTI03 | 64x256 | Robotics |
| RWIBEAM2 | 64x128 | Robotics |
| RWIBEAM3 | 256x128 | Robotics |
| RWURINE1 | 128x128 | Robotics |
| RWURINE2 | 32x64 | Robotics |
| SPPIT4 | 64x64 | Sewers |
| SWPIT1 | 64x128 | Sewers |
| SWPIT2 | 64x128 | Sewers |
| SWPIT3 | 64x256 | Sewers |
| SWPIT4 | 64x128 | Sewers |
| SWPIT5 | 64x512 | Sewers |
| SWREBAR1 | 128x64 | Sewers |
| SWSLANT1 | 128x64 | Sewers |
| TWBARLT1 | 64x128 | Talay |
| TWBARLT3 | 256x128 | Talay |
| TWCAP01 | 128x256 | Talay |
| TWCAP03 | 64x256 | Talay |
| TWCAP07 | 64x256 | Talay |
| TWHANGR1 | 64x128 | Talay |
| ZWBARLT1 | 64x128 | Generic |
| ZWBARLT2 | 64x128 | Generic |
| ZWBARPAD | 64x128 | Generic |
| ZWCARGP1 | 64x128 | Generic |
| ZWCARGP2 | 32x128 | Generic |
| ZWCARGP3 | 64x128 | Generic |
| ZWCARGP4 | 64x128 | Generic |
| ZWCARGP5 | 64x128 | Generic |
| ZWCARGP6 | 64x128 | Generic |
| ZWCARGP7 | 128x128 | Generic |
| ZWCARGP9 | 128x128 | Generic |
| ZWCHOMP1 | 64x64 | Generic |
| ZWCMENT1 | 128x64 | Generic |
| ZWCMENT2 | 128x64 | Generic |
| ZWCMENT3 | 128x64 | Generic |
| ZWCMENT4 | 128x64 | Generic |
| ZWCMENT5 | 128x64 | Generic |
| ZWCOLUM3 | 256x128 | Generic |
| ZWDARK1 | 64x128 | Generic |
| ZWDARK2 | 64x128 | Generic |
| ZWDARK4 | 64x128 | Generic |
| ZWDARK5 | 64x128 | Generic |
| ZWEXT01 | 32x128 | Generic |
| ZWEXT01D | 128x256 | Generic |
| ZWEXT02 | 32x128 | Generic |
| ZWEXT03 | 32x128 | Generic |
| ZWEXT04 | 32x128 | Generic |
| ZWEXT05 | 32x128 | Generic |
| ZWEXT06 | 32x128 | Generic |
| ZWEXT07 | 32x128 | Generic |
| ZWEXT08 | 64x128 | Generic |
| ZWEXT09L | 64x128 | Generic |
| ZWFACIST | 64x128 | Generic |
| ZWHALL3 | 32x128 | Generic |
| ZWHALL7 | 32x128 | Generic |
| ZWHALL7S | 32x128 | Generic |
| ZWHITEC1 | 128x128 | Generic |
| ZWHITEC2 | 128x128 | Generic |
| ZWIBEAM1 | 64x64 | Generic |
| ZWIMP15 | 64x128 | Generic |
| ZWIMP19 | 64x128 | Generic |
| ZWIMP20 | 128x128 | Generic |
| ZWIMP27 | 128x128 | Generic |
| ZWIMP28 | 64x128 | Generic |
| ZWINDSP1 | 128x128 | Generic |
| ZWINT01 | 64x128 | Generic |
| ZWINT02 | 64x128 | Generic |
| ZWINT04 | 32x128 | Generic |
| ZWINT05 | 32x128 | Generic |
| ZWINT06 | 32x128 | Generic |
| ZWINT07 | 32x128 | Generic |
| ZWINT08 | 64x128 | Generic |
| ZWINT09 | 64x128 | Generic |
| ZWINT10 | 32x128 | Generic |
| ZWINT11 | 32x128 | Generic |
| ZWINT12 | 32x128 | Generic |
| ZWINT13 | 32x128 | Generic |
| ZWINT14 | 32x128 | Generic |
| ZWINT15 | 32x128 | Generic |
| ZWINT16 | 32x128 | Generic |
| ZWINT21 | 128x128 | Generic |
| ZWINT22 | 64x128 | Generic |
| ZWJABPI1 | 64x128 | JabShip |
| ZWLOUNG | 64x128 | Generic |
| ZWPANEL4 | 32x128 | Generic |
| ZWPANLC1 | 64x128 | Generic |
| ZWPANLC3 | 64x128 | Generic |
| ZWSMUGGL | 128x512 | Generic |

## windows

| Texture | Size | From |
| --- | --- | --- |
| IWBRWIN1 | 128x64 | Avenger (NightDive) |
| IWBRWIN2 | 128x64 | Arc |
| TWILI10A | 64x128 | Talay |
| TWILI10B | 64x128 | Talay |
| TWILI10C | 64x128 | Talay |
| ZMTUBE | 128x128 | Generic |
| ZWPORTHL | 64x128 | Generic |
