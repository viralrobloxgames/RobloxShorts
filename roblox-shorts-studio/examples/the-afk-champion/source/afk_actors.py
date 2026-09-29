"""Per-time character states. Each returns dict(pos=(x,y), floor=z | z=abs, yaw, tilt=(rx,ry), scale, angles)."""
import math
from characters import action_pose
from afk_timeline import *

PARK = {'pos': (0, 0), 'z': -200, 'angles': {}}
CRATE_X, CRATE_Y = 0.0, -0.5
BOAT = (4.2, -0.5)
LEO_HOME = (0.0, 0.3)


def water(t):
    if t < R2:
        return -0.6 + 3.6 * smooth(6.9, 14.0, t)
    return -0.6


def crate_z(t):      # crate centre
    return max(0.6, water(t) - 0.1) if (t < R2 or t >= LOOP) else 0.6


def boat_z(t):       # hull centre
    return max(0.5, water(t) + 0.25)


def face(dx, dy):
    return math.degrees(math.atan2(dx, -dy))


def run_between(t, t0, t1, a, b, speed=2.2):
    u = smooth(t0, t1, t)
    moving = t0 < t < t1
    pos = lerp(a, b, u)
    ang = action_pose('Run', t * speed) if moving else action_pose('Idle', t * .6)
    return pos, face(b[0] - a[0], b[1] - a[1]) if moving else 0.0, ang


def panic(t, x0, phase):
    """Hook panic: sprint back and forth in front of the wave, kept three-quarter to camera
    so both faces stay readable in frame 1."""
    s = math.sin(t * 2.3 + phase)
    ang = action_pose('Run', t * 2.4 + phase)
    ang['Arm.L'] = (-120, 0, -12); ang['Arm.R'] = (-120, 0, 12)   # arms up, panicking
    return {'pos': (x0 + 0.7 * s, -2.6), 'floor': 0.0,
            'yaw': 42 if math.cos(t * 2.3 + phase) > 0 else -42, 'angles': ang}


AFK = {'Head': (9, 0, 0), 'Arm.L': (0, 0, -3), 'Arm.R': (0, 0, 3)}


def leo(t, press_amt=0.0):
    if t < R2 or t >= LOOP:
        return {'pos': (CRATE_X, CRATE_Y), 'floor': crate_z(t) + 0.6, 'angles': dict(AFK)}
    if t < R4:
        return {'pos': LEO_HOME, 'floor': 0.0, 'angles': dict(AFK)}
    if t < R5:
        if t < 37.7:
            pos = (0.0, -0.2)
        elif t < 38.05:   # lag: flicker between old and new spot
            pos = (0.0, -0.2) if int((t - 37.7) * FPS) % 2 == 0 else (0.35, 0.8)
        else:
            pos = (0.35, 0.8)
        return {'pos': pos, 'floor': 0.9, 'angles': dict(AFK)}
    if t < WIN:
        a = dict(AFK)
        back = smooth(50.9, 51.3, t) * (1 - smooth(51.3, 51.45, t))
        snap = smooth(51.3, 51.45, t) * (1 - smooth(51.6, 51.9, t))
        a['Head'] = (9 - 24 * back + 30 * snap, 0, 0)
        a['Torso'] = (-6 * back + 12 * snap, 0, 0)
        a['Arm.L'] = (-25 * snap, 0, -8 * snap - 3)
        a['Arm.R'] = (-25 * snap, 0, 8 * snap + 3)
        return {'pos': LEO_HOME, 'floor': 0.0, 'angles': a}
    # Winner: looks around, talks, presses ready
    a = action_pose('Idle', t * .6)
    look = math.sin((t - 57.6) * 5.5) * smooth(57.6, 57.9, t) * (1 - smooth(58.5, 58.9, t))
    a['Head'] = (0, 38 * look, 0)
    if 59.6 < t < 61.0:
        a = action_pose('Talk', t * 1.4)
    a['Arm.R'] = (-45 * press_amt, 0, 3 * (1 - press_amt))
    return {'pos': LEO_HOME, 'floor': 0.0, 'yaw': 0.0, 'angles': a}


def leo_press(t):
    return smooth(61.5, 61.8, t) * (1 - smooth(62.2, 62.6, t))


def maxx(t):
    if t < R1 or t >= LOOP:
        return panic(t, -3.5, 0.0)
    if t < 8.1:
        pos, yaw, ang = run_between(t, R1, 8.0, (-2.3, -2.0), (-4.2, -0.1))
        return {'pos': pos, 'floor': 0.0, 'yaw': yaw, 'angles': ang}
    if t < 9.6:
        u = smooth(8.1, 9.5, t); c = math.sin(t * 14)
        return {'pos': (-4.2, -0.05), 'z': -0.03 + 6.35 * u, 'yaw': 180,
                'angles': {'Arm.L': (-165 + 18 * c, 0, 0), 'Arm.R': (-165 - 18 * c, 0, 0), 'Leg.L': (20 * c, 0, 0), 'Leg.R': (-20 * c, 0, 0)}}
    if t < R2:
        wob = 0.05 * math.sin(t * 7) * smooth(11.0, 12.5, t)
        ang = action_pose('Shock', t) if t > 11.4 else action_pose('Wave', t * 1.5)
        return {'pos': (-4.2 + 6.3 * math.sin(wob), 1.6), 'floor': 6.3, 'tilt': (0, math.degrees(wob)), 'angles': ang}
    if t < R3:
        pos, yaw, ang = run_between(t, 17.25, 18.2, (-2.0, -1.0), (-5.5, -1.0))
        if t > 18.2:
            ang = action_pose('Shock', t)
        return {'pos': pos, 'floor': 0.0, 'yaw': yaw, 'angles': ang}
    if t < 31.1:
        pos, yaw, ang = run_between(t, 26.8, 27.9, (-5.5, -1.0), (-2.1, -2.4))
        if t >= 27.9:
            ang = {'Torso': (14, 0, 0), 'Head': (-6, 0, 0), 'Arm.L': (-30, 0, -10), 'Arm.R': (-30, 0, 10)}
            yaw = 25.0
        return {'pos': pos, 'floor': 0.0, 'yaw': yaw, 'angles': ang}
    if t < 32.6:
        u = smooth(31.1, 32.5, t); cx = 9.5 - (t - 26.0) * 2.2
        r = 1.0 + 1.5 * u; a = t * 9
        return {'pos': (cx + r * math.cos(a), -2.6 + r * math.sin(a)), 'z': 14 * u, 'yaw': math.degrees(t * 12),
                'tilt': (60 * u * math.sin(t * 7), 50 * u), 'angles': action_pose('Shock', t)}
    if t < R5:
        return dict(PARK)
    return lobby_actor(t, LX - 2.3, 0.0)


def mia(t):
    if t < R1 or t >= LOOP:
        return panic(t, 3.5, 2.0)
    if t < 10.0:
        pos, yaw, ang = run_between(t, R1, 7.8, (2.3, -2.2), (2.6, -1.8))
        return {'pos': pos, 'floor': 0.0, 'yaw': yaw, 'angles': ang}
    if t < R2:
        if t < 10.9:
            u = smooth(10.0, 10.85, t)
            x, y, z = arc((2.6, -1.8, -0.03), (4.2, -0.5, boat_z(10.9) + 0.47), u, 1.4)
            return {'pos': (x, y), 'z': z, 'yaw': face(1.6, 1.3) * (1 - u), 'angles': {'Leg.L': (-25, 0, 0), 'Leg.R': (25, 0, 0), 'Arm.L': (-40, 0, -20), 'Arm.R': (-40, 0, 20)}}
        ang = action_pose('Wave', t * 1.5) if t < 12.5 else action_pose('Idle', t * .6)
        return {'pos': BOAT, 'floor': boat_z(t) + 0.5, 'tilt': (0, 3 * math.sin(t * 2.6)), 'angles': ang}
    if t < R3:
        pos, yaw, ang = run_between(t, 18.85, 19.7, (2.0, -1.0), (5.5, -1.0))
        return {'pos': pos, 'floor': 0.0, 'yaw': yaw, 'angles': ang}
    if t < R4:
        return {'pos': (-5.2, 2.6), 'floor': 0.0, 'angles': action_pose('Shock', t)}
    if t < R5:
        if t < 35.3:
            return {'pos': (4.1, -0.5), 'floor': 0.9, 'angles': action_pose('Idle', t * .6)}
        if t < 36.1:
            u = smooth(35.3, 36.05, t)
            x, y, z = arc((4.1, -0.5, 0.87), (1.5, -0.4, 0.87), u, 1.5)
            return {'pos': (x, y), 'z': z, 'yaw': -90, 'angles': {'Leg.L': (-25, 0, 0), 'Leg.R': (25, 0, 0), 'Arm.L': (-60, 0, 0), 'Arm.R': (-60, 0, 0)}}
        push = {'Arm.L': (-85, 0, 0), 'Arm.R': (-85, 0, 0)}
        if t < 38.6:
            u = clamp((t - 36.1) / 2.5)
            x = 1.5 - 3.3 * u
            ang = action_pose('Run', t * 2.6); ang.update(push)
            return {'pos': (x, -0.25), 'floor': 0.9, 'yaw': -90, 'angles': ang}
        if t < 39.45:
            u = smooth(38.6, 39.4, t)
            x, y, z = arc((-1.8, -0.25, 0.87), (-2.9, -0.25, -3.0), u, 0.8)
            return {'pos': (x, y), 'z': z, 'yaw': -90 + 60 * u, 'tilt': (0, -40 * u), 'angles': action_pose('Shock', t)}
        return dict(PARK)
    return lobby_actor(t, LX + 2.3, 1.3)


def lobby_actor(t, x, phase):
    if t < 44.0:
        ang = action_pose('Talk', t * 1.2 + phase)
    elif t < 46.2:
        ang = action_pose('Point', 0)
    elif t < 54.3:
        ang = action_pose('Laugh', t * 2 + phase)
    else:
        ang = action_pose('Shock', t)
    s = 1 - smooth(54.8, 55.25, t)
    if t >= 55.3:
        return dict(PARK)
    return {'pos': (x, -1.0), 'floor': 0.0, 'scale': max(s, 0.001), 'angles': ang}


EXPR = {
    'Leo': [(0, 'neutral'), (51.0, 'surprised'), (52.0, 'neutral'), (59.0, 'surprised'), (60.9, 'happy'), (LOOP, 'neutral')],
    'Max': [(0, 'surprised'), (9.6, 'happy'), (11.4, 'surprised'), (18.2, 'happy'), (R3, 'surprised'), (27.9, 'happy'),
            (30.3, 'surprised'), (R5, 'angry'), (44.0, 'happy'), (46.2, 'laugh'), (54.3, 'surprised'), (LOOP, 'surprised')],
    'Mia': [(0, 'surprised'), (8.0, 'neutral'), (10.9, 'happy'), (R2, 'neutral'), (19.7, 'happy'), (R3, 'surprised'),
            (R4, 'neutral'), (35.3, 'angry'), (38.6, 'surprised'), (38.9, 'sad'), (R5, 'angry'), (44.0, 'happy'),
            (46.2, 'laugh'), (54.3, 'surprised'), (LOOP, 'surprised')],
}
