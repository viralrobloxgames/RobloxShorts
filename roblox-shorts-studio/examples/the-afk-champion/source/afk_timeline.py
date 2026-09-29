"""Timing for The AFK Champion. Beat times come from audio/alignment/captions.json (spliced narration)."""
import math

FPS = 30
SECONDS = 64.5          # speech ends 63.32 s; keeps the Short safely over one minute
END = round(SECONDS * FPS)  # 1935 frames
LX = 60.0               # lobby is built far to the side of the island


def F(t):
    return max(1, round(t * FPS) + 1)


def T(f):
    return (f - 1) / FPS


def clamp(v, a=0.0, b=1.0):
    return max(a, min(b, v))


def smooth(a, b, t):
    u = clamp((t - a) / (b - a))
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return tuple(x + (y - x) * u for x, y in zip(a, b))


def arc(a, b, u, height):
    """Jump/throw arc from a to b with extra height at the middle."""
    p = lerp(a, b, u)
    return (p[0], p[1], p[2] + height * 4 * u * (1 - u))


# Round boundaries (hard cuts reset the arena)
HOOK, R1, R2, R3, R4, R5, WIN, LOOP = 0.0, 5.7, 15.1, 26.0, 32.8, 39.9, 56.2, 62.9

# (start, title, target, ortho_scale, azimuth_deg, elevation_deg, featured actor for framing check)
SHOTS = [
    (0.0,  'Hook: wave and AFK Leo',   (0, 0.5, 4.6),   19, 0,   4,  'Leo'),
    (2.8,  'Hook: Leo does not move',  (0, -0.5, 3.6),  9,  -15, 10, 'Leo'),
    (4.5,  'Hook: wave looms',         (0, 1.5, 5.4),   20, 16,  3,  'Leo'),
    (5.7,  'Round one: flood',         (0, 1.0, 3.2),   18, 0,   24, 'Leo'),
    (8.1,  'Max climbs the tower',     (-4.2, 1.2, 4.8), 19, -25, 10, 'Max'),
    (10.0, 'Mia grabs a boat',         (3.8, -1.0, 3.4), 12, 25,  12, 'Mia'),
    (11.7, 'Leo floats on the crate',  (0, -0.5, 5.6),  11, 0,   14, 'Leo'),
    (13.7, 'Flood wide',               (0, 0.0, 5.2),   20, -10, 20, 'Leo'),
    (15.1, 'Round two: meteors',       (0, 0.0, 4.2),   20, 0,   28, 'Leo'),
    (17.2, 'Max dodges left',          (-3.6, -1.0, 3.0), 11, -20, 18, 'Max'),
    (18.8, 'Mia dodges right',         (3.6, -1.0, 3.0), 11, 20,  18, 'Mia'),
    (20.3, 'Every meteor misses Leo',  (0, 0.0, 3.2),   12, 0,   24, 'Leo'),
    (22.6, 'The big one',              (0, -1.0, 5.0),  18, 15,  18, 'Leo'),
    (24.4, 'A wall',                   (0, -1.0, 3.0),  10, -10, 14, 'Leo'),
    (26.0, 'Round three: tornado',     (3.0, 0.0, 6.0), 22, 10,  14, 'Leo'),
    (27.9, 'Max hides',                (-1.6, -2.2, 3.0), 10, -20, 10, 'Max'),
    (30.1, 'Tornado takes the meteor', (0, -2.0, 7.0),  18, 0,   10, None),
    (31.1, 'And Max',                  (-2.0, -2.5, 9.0), 20, 0,  6,  'Leo'),
    (32.8, 'Round four: lava',         (1.0, 0.0, 3.2), 18, 0,   28, 'Leo'),
    (35.3, 'Mia charges',              (2.0, -0.3, 3.4), 10, 20,  14, 'Mia'),
    (37.6, 'Leo lagged',               (0, 0.0, 3.8),   10, 35,  12, 'Leo'),
    (38.7, 'She did not',              (-2.2, -0.5, 2.0), 11, -10, 20, None),
    (39.9, 'Lobby: last disaster',     (LX, 0.6, 3.6),  17, 0,   12, 'Max'),
    (44.0, 'Kick all AFK players',     (LX, 2.2, 4.2),  16, 0,   6,  None),
    (46.2, 'bye Leo',                  (LX - 2, -1.0, 3.6), 12, -15, 10, 'Max'),
    (48.9, 'Scanner',                  (0, 0.0, 3.6),   12, 0,   14, 'Leo'),
    (50.8, 'Sneeze',                   (0, 0.0, 4.7),   6,  10,  6,  'Leo'),
    (52.0, 'Player active',            (0, 0.0, 4.4),   13, 0,   12, 'Leo'),
    (53.5, 'Kick bounces',             (0, 0.0, 9.0),   20, 0,   5,  'Leo'),
    (54.3, 'Lobby zapped',             (LX, -1.0, 3.2), 13, 0,   12, None),
    (56.2, 'Winner',                   (0, 0.0, 5.6),   14, 0,   14, 'Leo'),
    (57.6, 'Did the game start?',      (0, 0.0, 3.4),   10, -10, 8,  'Leo'),
    (61.4, 'Pressed ready',            (-0.8, -0.4, 3.4), 9, -20, 12, 'Leo'),
    (62.9, 'Loop back to the wave',    (0, 0.5, 4.6),   19, 0,   4,  'Leo'),
]


def cam_pose(target, az, el, dist=60.0):
    a, e = math.radians(az), math.radians(el)
    d = (math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e))
    return tuple(t + dist * v for t, v in zip(target, d))
