"""Prop motion tracks: (object, [(t0, t1)], fn(t) -> (loc, rot, scale)). Outside the windows objects are parked."""
import math, random
from afk_timeline import *
from afk_actors import water, crate_z, boat_z, leo, leo_press, LEO_HOME

METEORS = [  # (impact time, x, y, size)
    (16.3, -3.0, 2.6, 1.0), (17.0, 4.6, 3.0, .9), (18.0, -2.0, -1.0, 1.0), (19.6, 2.0, -1.0, 1.0),
    (20.9, 1.45, 1.0, .8), (21.4, -1.35, 1.25, .8), (21.9, 1.35, -0.8, .8), (22.3, -1.5, -0.35, .8),
    (23.2, -5.0, -3.0, 1.0), (24.3, 0.0, -2.1, 1.7),
]
ROCK_T = 24.3


def tornado_x(t):
    return 9.5 - (t - 26.0) * 2.2


def tracks(O, press_cap):
    rng = random.Random(11)
    T = []
    add = lambda ob, windows, fn: T.append((ob, windows, fn))

    add(O['ocean'], [(0, SECONDS + 1)], lambda t: ((0, 0, water(t) - 2.5), None, None))

    def wave(t):
        if t < R1 + 1.3:
            y = 14 - 4 * smooth(0, 5.5, t) - 4 * smooth(5.5, 7.0, t)
            return ((0, y, 0), None, (1, 1, 1 - .85 * smooth(5.6, 7.0, t)))
        return ((0, 17 - 3 * smooth(LOOP, SECONDS, t), 0), None, (1, 1, .55 + .45 * smooth(LOOP, SECONDS, t)))
    add(O['wave'], [(0, R1 + 1.3), (LOOP, SECONDS + 1)], wave)

    base = lambda ob: tuple(ob.location)
    tw, bt, cr = base(O['tower']), base(O['boat']), base(O['crate'])
    add(O['tower'], [(0, R2), (LOOP, SECONDS + 1)],
        lambda t: (tw, (0, .05 * math.sin(t * 7) * smooth(11.0, 12.5, t) if t < R2 else 0, 0), None))
    add(O['boat'], [(0, R2), (LOOP, SECONDS + 1)],
        lambda t: ((bt[0], bt[1], boat_z(t)), (0, math.radians(3 * math.sin(t * 2.6)) if t > 10 and t < R2 else 0, 0), None))
    add(O['crate'], [(0, R2), (LOOP, SECONDS + 1)], lambda t: ((cr[0], cr[1], crate_z(t)), None, None))

    for i, (hit, x, y, size) in enumerate(METEORS):
        sx, sy, sz = x + 7, y + 5, 24

        def met(t, hit=hit, x=x, y=y, size=size, sx=sx, sy=sy, sz=sz):
            u = clamp((t - (hit - .7)) / .7)
            return ((sx + (x - sx) * u, sy + (y - sy) * u, sz + (0.5 - sz) * u), (t * 5, t * 3, 0), (size,) * 3)
        add(O['meteors'][i], [(hit - .7, hit)], met)

        def flash(t, hit=hit, x=x, y=y, size=size):
            u = clamp((t - hit) / .3)
            s = size * (0.5 + 2.2 * u) * (1 - u) + .001
            return ((x, y, .4), None, (s, s, s * .7))
        add(O['flashes'][i], [(hit, hit + .3)], flash)
        if i != len(METEORS) - 1:
            add(O['craters'][i], [(hit, R4)], lambda t, x=x, y=y, size=size: ((x, y, .01), None, (size * 1.1, size * 1.1, 1)))

    rx, ry, rz = 0.0, -2.1, 0.55
    def rock(t):
        if t < 30.2:
            g = smooth(ROCK_T, ROCK_T + .15, t)
            return ((rx, ry, rz), (0, 0, .3), (1.7 * g + .001, .9 * g + .001, 1.35 * g + .001))
        u = smooth(30.2, 31.5, t)
        return ((tornado_x(t) + math.cos(t * 9) * u, -2.6 + math.sin(t * 9) * u, rz + 16 * u), (t * 6, t * 4, t * 3), (1.7, .9, 1.35))
    add(O['rock'], [(ROCK_T, 32.0)], rock)

    add(O['tornado'], [(R3, R4)], lambda t: ((tornado_x(t), -2.6, 0), (0, 0, t * 9), (1 + .04 * math.sin(t * 11),) * 2 + (1,)))

    add(O['lava'], [(R4, R5)], lambda t: ((0, 0, .05), None, (1, 1, 1 + .15 * math.sin(t * 4))))
    add(O['leo_rock'], [(R4, R5)], lambda t: ((0, -.1, .45), None, None))
    add(O['mia_stone'], [(R4, R5)], lambda t: ((4.1, -.5, .45), None, None))
    add(O['spare_stone'], [(R4, R5)], lambda t: ((-4.3, 1.5, .45), None, None))

    for i, coin in enumerate(O['coins']):
        t0 = R5 + .4 + i * .15
        sx = LX - 2.3 if i % 2 == 0 else LX + 2.3
        ex = LX + rng.uniform(-2.2, 2.2)
        add(coin, [(t0, t0 + .55)], lambda t, t0=t0, sx=sx, ex=ex: (
            arc((sx, -1.6, 2.8), (ex, 2.8, 2.7), clamp((t - t0) / .5), 2.2), (math.pi / 2, 0, t * 10), None))
    kp = tuple(O['kick_panel'].location)
    add(O['kick_panel'], [(R5 - .2, WIN)], lambda t: (kp, None, (1 + .06 * abs(math.sin(t * 9)),) * 3))
    add(O['bubble'], [(46.2, 48.9)], lambda t: ((LX - 2.0, -1.0, 6.9 + .08 * math.sin(t * 5)), None, (smooth(46.2, 46.4, t) + .001,) * 3))

    add(O['scan_shaft'], [(48.9, 53.5)], lambda t: ((0.0, LEO_HOME[1], 5.5), None, (1, 1, 1)))
    add(O['scanner'], [(48.9, 53.5)], lambda t: ((0.0, LEO_HOME[1], 4.0 + 3.8 * math.cos((t - 48.9) * 2.6)), None, (1 + .08 * math.sin(t * 20),) * 2 + (1,)))
    add(O['active'], [(52.0, 53.5)], lambda t: ((0, -.9, 7.3), None, (smooth(52.0, 52.2, t) + .001,) * 3))
    add(O['beam'], [(53.5, 54.3)], lambda t: ((0, LEO_HOME[1], 20 * smooth(53.5, 53.9, t) + .001), None, (1, 1, smooth(53.5, 53.9, t) + .001)))
    add(O['zap'], [(54.3, 54.95)], lambda t: ((LX, -1.0, 40 - 25 * smooth(54.3, 54.5, t)), None, (3.6, 1.4, 1)))
    for i, blk in enumerate(O['poofs']):
        cx = LX - 2.3 if i < 8 else LX + 2.3
        a = i * math.tau / 8
        add(blk, [(54.85, 55.7)], lambda t, cx=cx, a=a: (
            (cx + 2.2 * smooth(54.85, 55.6, t) * math.cos(a), -1.3, 3.0 + 2.2 * smooth(54.85, 55.6, t) * math.sin(a)),
            (t * 4, t * 3, 0), ((1 - smooth(55.2, 55.7, t)) + .001,) * 3))

    add(O['winner'], [(WIN, LOOP)], lambda t: ((0, -.9, 7.9 + .12 * math.sin(t * 3)), None, (min(1, smooth(WIN, WIN + .25, t) * 1.1) + .001,) * 3))
    for i, c in enumerate(O['confetti']):
        x, y, off, spin = rng.uniform(-6, 6), rng.uniform(-3, 3), rng.uniform(0, 14), rng.uniform(2, 6)
        add(c, [(WIN, LOOP)], lambda t, x=x, y=y, off=off, spin=spin: (
            (x + .4 * math.sin(t * 2 + off), y, 14 - ((t - WIN) * 2.4 + off) % 14), (t * spin, t * spin * .7, 0), None))

    add(O['afk'], [(0, 52.0), (LOOP, SECONDS + 1)], None)   # follows Leo; filled in by the frame loop
    add(O['ready'], [(61.0, LOOP)], lambda t: ((press_cap[0], press_cap[1] + .02, press_cap[2] - 1.9), None, None))
    add(O['ready_cap'], [(61.0, LOOP)], lambda t: ((press_cap[0], press_cap[1], press_cap[2] - .07 * leo_press(t)), None, None))
    return T
