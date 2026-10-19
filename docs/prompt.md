# RABBITVERSE — Multiverse 3D Platformer

I want you to build an original AAA-quality third-person 3D platformer in Three.js/WebGPU at the level of the best modern cinematic mascot platformers, using **Crash Bandicoot: Warped** and **Crash Bandicoot 4: It's About Time** as the gameplay-quality benchmark, but with entirely original characters, worlds, enemies, art, lore, mechanics, and assets.

The game is called **RABBITVERSE**.

You play as an extremely expressive cartoon rabbit accidentally thrown across a collapsing multiverse. Every world is a radically different reality, time period, art style, physics system, and gameplay remix. The rabbit travels through dimensional portals trying to repair reality while an eccentric multiversal villain deliberately crashes timelines together.

It must feel immediately fun just to **run, jump, spin, slide, bounce, smash things, chain movement together, collect objects, discover secrets, and break crates**.

The character controller is the foundation of the entire game. Do not accept mediocre movement.

## CORE GAME FEEL

Build a polished third-person platforming controller with:

* analog walk/run
* acceleration/deceleration
* responsive turning
* jump
* variable jump height
* coyote time
* jump buffering
* landing anticipation
* squash/stretch
* secondary jump
* double jump once unlocked
* spin attack
* aerial spin
* slide
* slide jump
* crouch
* crawl
* belly/flop attack
* bounce attacks
* ledge forgiveness
* moving-platform support
* knockback
* invulnerability frames
* contextual animation blending
* strong shadow/blob indicator beneath the rabbit
* extremely readable depth perception
* satisfying physics without floatiness
* controller support
* keyboard controls
* camera-relative movement

Movement should eventually support advanced combinations such as:

**run → slide → jump → spin → double jump → aerial ability → landing attack**

Skilled players should be able to preserve momentum and discover movement techniques while ordinary players can comfortably finish the game.

Make animations extremely expressive: ears reacting to acceleration and wind, body squash/stretch, anticipation poses, facial expressions, eye tracking, foot planting, skid animations, dust, impact frames, smear effects, particles, camera impulses and exaggerated cartoon physics.

## ABILITY PROGRESSION

Do NOT give the player every ability immediately.

A central part of the game loop is **winning worlds/bosses to permanently unlock new powers**, and later levels are designed around combining abilities learned earlier.

Example progression:

1. **Jump + basic attack**
2. **Spin Attack**
3. **Slide**
4. **Body Slam**
5. **Double Jump**
6. **Long Spin / aerial hover**
7. **Projectile ability** — throw dimensional carrots/energy objects
8. **Super Body Slam**
9. **Sprint / rabbit dash**
10. **Spin + double-jump combinations**
11. **Wall kick / wall scramble**
12. **Dimensional grapple**
13. **Ground burrow**
14. **Air dash**
15. **Time manipulation**
16. **Gravity manipulation**

Later levels MUST contain paths, crates, secrets, gems and shortcuts that were visibly inaccessible during the player's first visit, encouraging replay after new abilities are unlocked.

Do not make powers cosmetic. **Every unlocked move becomes part of future level grammar.**

## MULTIVERSE POWERS

In addition to permanent rabbit abilities, create temporary **Reality Powers** analogous to level-specific transformative mechanics.

Examples:

### TIME

Slow selected moving objects while the rabbit remains at normal speed.

Use for:

* collapsing platforms
* spinning hazards
* enemy projectiles
* moving machinery
* traversal puzzles
* precision platform chains

### GRAVITY

Flip gravity between surfaces.

Use for:

* ceiling platforming
* falling between orientations
* gravity puzzles
* inverted chase sequences

### PHASE

Switch between two overlapping versions of reality.

Platforms, hazards, enemies and routes can exist in Reality A or Reality B.

The player rapidly phases between them during platform sequences.

### ELASTICITY

Temporarily transform the rabbit into an ultra-elastic state.

Use for:

* enormous bounce chains
* stretching through gaps
* ricocheting between surfaces
* high-speed pinball sequences

### QUANTUM CLONE

Record or duplicate a short action sequence and interact with your past movement.

### SCALE

Temporarily become tiny or enormous, altering traversal and environmental interactions.

These powers should be introduced safely, taught without text whenever possible, expanded, combined with existing abilities, tested under pressure, and finally remixed in mastery challenges.

## LEVEL DESIGN GRAMMAR

Do not build generic open terrain.

Every level must be deliberately authored around strong platforming composition.

Use:

* forward-running lanes
* side-scrolling sections
* open arena sections
* vertical climbing
* descending sequences
* chase sequences
* escape sequences
* riding sequences
* vehicle stages
* rail grinding
* animal/creature riding
* collapsing environments
* moving platforms
* rotating platforms
* timed platforms
* disappearing platforms
* bouncing objects
* ropes/vines
* swinging hazards
* grind rails
* cannons
* launch pads
* wall-running segments
* underwater sections
* zero-gravity sections
* perspective changes
* branching routes
* risky shortcuts
* secret paths
* optional challenge routes

Constantly alternate rhythm:

**safe → teach → challenge → breathe → remix → surprise → mastery → spectacle**

Every mechanic should follow:

**Introduce → Demonstrate → Test → Twist → Combine → Master**

Never spam random obstacles.

Platform placement must communicate where the player should look and jump.

## CRATES / BREAKABLE OBJECTS

Build a deep breakable-container system inspired by classic mascot platformers but completely original visually.

Create multiple recognizable container types:

* normal breakable crates
* fruit/carrot crates
* bouncing multiplier crates
* timed crates
* explosive crates
* delayed explosives
* reinforced crates
* attack-only crates
* body-slam crates
* invisible/phase crates
* checkpoint crates
* life/health crates
* chained crates
* mystery crates
* dimensional crates
* moving crates
* crates accessible only with later powers

Breaking them needs exceptional game feel:

* deformation
* fragments
* dust
* particles
* sound variation
* screen feedback
* collectible burst patterns
* chain reactions
* physical debris
* haptics where available

A level should track **all breakable objects**, rewarding players for destroying every one.

## COLLECTIBLES

Create several overlapping completion systems.

Examples:

### DIMENSIONAL CARROTS

Common collectible arranged through levels to guide movement.

Collect enough for bonus rewards/lives/score.

### REALITY GEMS

Awarded for objectives such as:

* destroy every crate
* collect a required percentage of carrots
* finish below a death threshold
* find a hidden route
* complete a reality challenge

### RELICS

Time-trial rewards with multiple ranks.

### SHARDS

Hidden collectible fragments requiring exploration or ability mastery.

### COSTUMES

Unlock visual rabbit skins, ear styles, colors, accessories and absurd alternate appearances through actual gameplay achievements.

### PERFECT RELICS

Reward completing extremely difficult conditions such as every crate + no deaths.

Completionists should be able to replay every stage chasing increasingly difficult objectives.

## CHECKPOINTS / DEATH

Deaths should be funny, fast, readable and minimally frustrating.

Create contextual cartoon death animations for:

* falling
* crushing
* fire
* freezing
* electricity
* lasers
* explosions
* drowning
* eaten by creatures
* dimensional disintegration
* gravity failure
* time distortion
* enemy attacks

Respawn almost immediately.

Checkpoints preserve reasonable progress.

Repeated failure can optionally create subtle accessibility assistance without insulting the player.

## WORLD STRUCTURE

Build a **multiverse hub** from which the rabbit enters portals.

The hub itself should evolve as realities are repaired.

Each dimensional region contains several normal levels followed by a boss.

Example realities:

### 1. PRIMEVAL BURROW

Gigantic prehistoric vegetation, dinosaurs, waterfalls, volcanic caves and oversized rabbit ancestors.

### 2. CLOCKWORK KINGDOM

Impossible Renaissance machinery, giant clocks, gears, canals, brass automata and moving cities.

### 3. PIRATE OCEAN REALITY

Tropical islands, ships, storms, sea monsters, water physics, cannons and surfing.

### 4. NEON 2099

Cyberpunk rabbit megacity with hover traffic, rails, holograms and impossible skyscrapers.

### 5. CARTOON VOID

1930s rubber-hose universe where physics behaves like animation.

### 6. MINIATURE REALITY

The rabbit is insect-sized inside an enormous household/garden.

### 7. GIANT REALITY

The rabbit becomes enormous and runs across cities and mountains.

### 8. FEUDAL MOON

Moonlit temples, cherry blossoms, bamboo forests, spirits and gravity anomalies.

### 9. ICE AGE DIMENSION

Avalanches, slippery surfaces, caves, frozen creatures and snow deformation.

### 10. FRACTAL REALITY

Mandelbrot landscapes, recursive architecture, impossible portals and shifting geometry.

### 11. COLLISION REALITY

Several previous realities begin physically intersecting.

Pirate ships sail through skyscrapers. Dinosaurs invade clockwork cities. Gravity rotates. Reality changes mid-jump.

### 12. THE MULTIVERSE CORE

The final world rapidly combines every learned mechanic and ability.

Each world needs its own:

* lighting
* atmosphere
* materials
* foliage
* enemies
* hazards
* collectibles
* architecture
* music
* environmental storytelling
* traversal mechanic
* dimensional gimmick
* boss
* color language

## LEVEL VARIETY

Include stages comparable in variety to the great 1990s/modern mascot platformers:

* classic linear platform stages
* chase toward camera
* chase away from camera
* escaping giant creature
* riding a creature
* motorcycle/hover-bike equivalent
* jet-ski/surfing equivalent
* flying stage
* space stage
* underwater stage
* rail-grinding stage
* giant rolling-object escape
* snow/ice race
* aerial combat
* collapsing temple
* giant boss chase
* inverted-gravity stage
* rhythm-like machinery stage
* high-speed dimensional tunnel

Special stages should still use the game's collectibles and progression systems rather than feeling like unrelated minigames.

## ENEMIES

Enemies must behave like platforming obstacles first and combat opponents second.

Give each enemy a clear silhouette, readable timing and specific interaction.

Examples:

* patrol enemies
* shielded enemies
* projectile enemies
* burrowing enemies
* flying enemies
* charging enemies
* spinning enemies
* giant enemies
* phase-shifting enemies
* time-manipulating enemies
* gravity enemies
* mimics
* enemies that can be bounced on
* enemies whose projectiles can be reflected
* enemies used as traversal objects

Avoid health-sponge combat.

Many enemies should be defeated instantly once their behavior is understood.

## BOSSES

Every reality culminates in a bespoke boss with several escalating phases.

Boss design should test mechanics learned in that world rather than merely requiring repetitive attacks.

Structure:

**spectacle → readable mechanic → player response → escalation → new combination → cinematic finish**

Bosses should change arenas, destroy scenery, interact with physics and occasionally transform the entire style of the game.

The final boss tests **the complete accumulated movement vocabulary**.

## CAMERA

Build a dedicated intelligent platforming camera rather than a generic orbit camera.

It must:

* anticipate movement
* frame upcoming platforms
* avoid walls
* dynamically adjust FOV
* handle narrow corridors
* transition smoothly into side-on viewpoints
* transition into chase camera
* transition into vehicle camera
* frame bosses
* preserve depth perception
* avoid nausea
* never fight player input
* intelligently recenter
* support controller right-stick control

Camera quality is as important as character physics.

## ART DIRECTION

Make the game visually spectacular and highly stylized rather than generically realistic.

Aim for:

* animated-movie-quality composition
* exaggerated silhouettes
* rich materials
* painterly but physically believable lighting
* dense foliage
* environmental motion
* wind
* cloth
* fur
* water
* volumetric fog
* clouds
* particles
* contact shadows
* reflections
* animated emissives
* dimensional distortions
* procedural sky
* dramatic vistas
* strong color scripting
* excellent readability

The rabbit must have high-quality fur rendering while preserving cartoon expressiveness.

Use GPU instancing, LODs, texture atlases, compressed assets and sensible streaming so beauty does not destroy performance.

## DIMENSION TRANSITIONS

Reality switching is a headline feature.

Portals and dimension changes should be spectacular:

* geometry folding
* recursive portals
* chromatic splitting
* particles being sucked through space
* world material transitions
* realtime sky changes
* seamless portal traversal
* environments transforming around the player
* impossible windows into other realities
* fracturing world geometry
* objects existing simultaneously in multiple timelines

Whenever practical, let the player see another universe through the portal before entering it.

## PHYSICS

Build polished cartoon physics for:

* crates
* debris
* ropes
* bridges
* vegetation
* cloth
* water interaction
* moving machinery
* breakables
* projectiles
* explosions
* particles
* creature interactions
* falling structures

Prioritize deterministic gameplay over simulation chaos.

Physics should make interactions look richer without making jumps unreliable.

## SOUND / MUSIC

Every action needs layered responsive audio.

Create:

* footsteps by surface
* jump sounds
* ear movement
* landing
* spin
* slide
* impacts
* crate destruction
* collectible pickup chains
* dimensional portals
* enemy vocalizations
* ambient ecosystems
* machinery
* weather
* water
* UI
* power activation

Music should adapt to:

* exploration
* challenge sections
* chase sequences
* power states
* boss phases
* alternate realities

Each dimension needs a distinct musical identity while retaining recognizable melodic motifs.

## UI / UX

Keep HUD minimal.

Show information when relevant:

* carrots/collectibles
* crates destroyed / total
* gems
* deaths
* timer
* powers
* checkpoint
* boss state

Create:

* title screen
* save slots
* pause menu
* settings
* controller remapping
* keyboard remapping
* audio controls
* graphics presets
* accessibility controls
* collectible screen
* dimensional map
* level completion screen
* costume selection
* time-trial leaderboards/local records
* completion percentage

Target a satisfying **100%+ completion meta-game** where additional percentages or mastery tiers represent difficult optional challenges.

## ACCESSIBILITY

Include:

* remappable controls
* subtitles
* colorblind-safe indicators
* reduced camera shake
* reduced motion
* adjustable FOV
* hold/toggle options
* difficulty assistance
* generous checkpoint options
* audio controls
* readable UI scaling

Do not compromise the baseline platforming design to achieve accessibility; provide configurable alternatives.

## PERFORMANCE

This is a browser-based Three.js/WebGPU game.

Make it extraordinary while remaining technically disciplined.

Target:

* stable 60 FPS on capable hardware
* scalable graphics settings
* WebGPU first where appropriate
* WebGL fallback where practical
* GPU instancing
* aggressive frustum/occlusion culling
* LOD systems
* mesh merging
* texture compression
* asynchronous asset loading
* object pooling
* pooled particles
* efficient animation rigs
* BVH/collision optimization
* minimal garbage generation during gameplay
* chunk/room streaming where necessary

Measure performance continuously.

Do not optimize by making the game visually empty.

## FIRST PLAYABLE TARGET

Do not initially build 100 shallow levels.

First create one astonishing **vertical-slice level** containing:

* polished rabbit character
* full basic movement
* spin
* slide
* crates
* carrots
* checkpoint
* several enemy types
* secret route
* moving platforms
* side-scrolling transition
* chase section
* temporary Reality Power
* dimensional portal sequence
* environmental destruction
* gem objectives
* level-end results
* hub portal
* one boss encounter

This slice should demonstrate the entire production quality bar.

Once the vertical slice is exceptional, systematically expand the game.

## GAMEPLAY VALIDATION

Build automated and agent-controlled gameplay tests.

Agents must actually play levels.

Test:

* can every jump be completed?
* can every collectible be collected?
* can every crate be destroyed?
* can the level be completed without damage?
* can the level be completed without dying?
* are checkpoints valid?
* can powers soft-lock the game?
* can moving platforms strand the player?
* does the camera fail?
* can the rabbit fall through geometry?
* are shortcuts intentional?
* are speedrun routes possible?
* does respawning preserve valid state?
* does changing dimension break collision?

Build debug tools to visualize:

* collision geometry
* jump arcs
* player velocity
* checkpoints
* spawn points
* enemy paths
* camera volumes
* collectible routes
* crate IDs
* performance
* draw calls
* GPU timings

## AGENT EXECUTION STRATEGY

Fan out specialized sub-agents.

Assign agents individually to:

* character controller
* rabbit character + animation
* camera
* level design
* environmental art
* lighting
* materials
* vegetation
* water
* VFX
* dimensional portals
* physics
* enemy AI
* bosses
* collectibles
* crates
* progression
* ability unlocks
* Reality Powers
* vehicles
* sound
* music
* UI
* accessibility
* optimization
* QA
* gameplay testing
* visual comparison

Each discipline must be independently reviewed.

Use `/loop` aggressively.

For every major feature:

**implement → run → play → inspect visually → measure → criticize → repair → replay → compare → repeat**

Have separate harsh critic agents that did NOT implement the feature.

The critic should behave like a professional AAA gameplay director, art director, animation director, technical director and level designer.

They should specifically identify:

* amateur-looking graphics
* weak animation
* floaty controls
* poor jump readability
* generic procedural environments
* repetitive layouts
* bad camera behavior
* muddy lighting
* weak silhouettes
* unsatisfying impacts
* excessive visual noise
* boring enemy behavior
* meaningless collectibles
* unfair hazards
* poor pacing
* inconsistent art
* frame-rate problems
* bugs
* incomplete interactions

If something looks or feels like an AI-generated tech demo, **reject it and rebuild it.**

## BLIND QUALITY COMPARISON

Regularly compare screenshots and recorded gameplay against top-tier modern 3D platformers, particularly the quality bar established by **Crash Bandicoot 4: It's About Time**, while keeping RABBITVERSE creatively and legally original.

Critic agents should perform blind comparisons whenever possible and answer:

**Which looks like the professionally shipped game?**

Also compare:

* animation
* environment density
* lighting
* camera
* effects
* movement responsiveness
* obstacle readability
* level pacing
* character appeal
* destruction
* UI
* boss spectacle

If RABBITVERSE obviously loses, identify why and `/loop`.

Do not merely imitate screenshots. Understand the production principles behind their quality and apply them to our original game.

## ABSOLUTE RULES

Do not settle for:

* primitive placeholder geometry
* programmer-art environments
* static scenes
* empty terrain
* generic asset dumps
* default Three.js materials
* bad Mixamo-looking animation transitions
* floaty platforming
* procedural clutter without composition
* random obstacle placement
* repetitive enemies
* meaningless open worlds
* loading screens when seamless streaming is practical
* giant walls of UI
* unfinished systems disguised as prototypes

Use temporary placeholders only when necessary to unblock development, then replace them.

Everything visible in the final game should feel intentionally art-directed.

Everything interactive should respond.

Every major mechanic should eventually combine with another mechanic.

Every level needs memorable visual identity and gameplay identity.

Every unlock must meaningfully expand what the player can do.

Every later world should demand mastery of earlier abilities.

The last levels should feel almost impossible to imagine completing with the rabbit from Level 1 because of how much the player's movement vocabulary has grown.

Do this in **Three.js/WebGPU**.

Fan out sub-agents.

Use **ultracode**.

Use `/loop` until the rabbit itself, the movement, animation, camera, environments, levels, powers, bosses, collectibles, VFX, sound, UI and overall game feel are genuinely exceptional.

Do not stop at "working."

Do not stop at "good."

Make **RABBITVERSE** feel like a lost $100-million mascot platformer from an alternate timeline.
