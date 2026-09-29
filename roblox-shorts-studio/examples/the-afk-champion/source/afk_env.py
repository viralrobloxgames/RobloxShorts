"""Static geometry for Disaster Island, the lobby and all disaster props (blocky, no simulations)."""
import bpy, math, random
from characters import material, cube, cylinder, sphere
from afk_timeline import LX


def glow(name, color, strength, alpha=1.0):
    m = material(name, color, .5)
    if alpha < 1:
        m.blend_method = 'BLEND'
        m.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value = alpha
    bs = m.node_tree.nodes.get('Principled BSDF')
    rgb = bs.inputs['Base Color'].default_value
    bs.inputs['Emission Color'].default_value = rgb
    bs.inputs['Emission Strength'].default_value = strength
    return m


def label(name, body, loc, size, mat, rot=(math.pi / 2, 0, 0), extrude=.03):
    d = bpy.data.curves.new(name, 'FONT'); d.body = body
    d.align_x = 'CENTER'; d.align_y = 'CENTER'; d.size = size; d.extrude = extrude; d.bevel_depth = .006
    o = bpy.data.objects.new(name, d); bpy.context.scene.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot; d.materials.append(mat)
    # Text becomes mesh so the farm never needs fonts.
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
    bpy.context.view_layer.objects.active = o; bpy.ops.object.convert(target='MESH'); o.select_set(False)
    return o


def empty(name, loc=(0, 0, 0)):
    e = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(e); e.location = loc
    return e


def parent_keep(child, parent):
    bpy.context.view_layer.update()
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def cone(name, loc, r1, r2, depth, mat, verts=24):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc)
    o = bpy.context.object; o.name = name; o.data.materials.append(mat)
    return o


def build():
    M = {
        'grass': material('Baseplate grass', '4CB84F', .8), 'dirt': material('Island dirt', '8A5A36', .9),
        'stud': material('Stud grass', '5CC85F', .7), 'water': material('Water', '2E86DE', .15),
        'wave': material('Wave water', '1D62B8', .2), 'deepwater': material('Deep water', '10427F', .25),
        'crest': material('Wave crest', '3E9BE0', .2),
        'foam': material('Foam', 'F2FBFF', .5), 'stone': material('Tower stone', '9AA3AD', .8),
        'window': material('Tower window', '2A3B4F', .4), 'wood': material('Crate wood', 'C58B4A', .85),
        'plank': material('Crate plank', '8C5A2B', .85), 'boat': material('Boat red', 'E2504C', .6),
        'rock': material('Meteor rock', '4A4447', .9), 'crater': material('Crater', '2B2622', 1),
        'meteor': glow('Meteor glow', 'FF7A1A', 6), 'flash': glow('Impact flash', 'FFD166', 10),
        'lava': glow('Lava', 'FF5A12', 2.2), 'lavadark': material('Lava crust', '7A1E0A', .9),
        'wind': material('Tornado grey', 'B9C2CC', .9), 'winddark': material('Tornado band', '7D8894', .9),
        'lobby': material('Lobby floor', '5B6EE1', .7), 'lobbytrim': material('Lobby trim', 'F2F5FF', .6),
        'panel': material('Shop panel', '1E2A44', .5), 'white': material('HUD white', 'FFFFFF', .5),
        'red': glow('Kick red', 'FF2E3F', 3), 'green': glow('Active green', '38F07A', 4),
        'beam': glow('Scan beam light', 'FF3A4A', 5, alpha=.30), 'beamcore': glow('Scan beam core', 'FFD2D6', 7, alpha=.55),
        'gold': material('Coin gold', 'FFC13D', .28, .55), 'ink': material('Tag ink', '14334C', .6),
        'bubble': material('Chat bubble', 'FFFFFF', .6), 'ready': glow('Ready button', '5DFF6A', 1.5),
        'pedestal': material('Button pedestal', '2D3A55', .6),
    }
    O = {}
    # Sun lights the lobby too (the character-kit area lights sit near the island).
    sun = bpy.data.lights.new('Sun', 'SUN'); sun.energy = 2.6; sun.angle = .2
    so = bpy.data.objects.new('Sun', sun); bpy.context.scene.collection.objects.link(so)
    so.rotation_euler = (math.radians(50), math.radians(10), math.radians(-30))

    # --- Island -----------------------------------------------------------
    cube('Island dirt', (0, 0, -1.6), (15, 11, 3.2), M['dirt'], .15)
    cube('Island grass', (0, 0, -.15), (15.2, 11.2, .3), M['grass'], .08)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=.24, depth=.12, location=(0, 0, 0))
    stud = bpy.context.object; stud.name = 'Stud master'; stud.data.materials.append(M['stud'])
    for i in range(11):
        for j in range(8):
            s = bpy.data.objects.new('Stud', stud.data); bpy.context.scene.collection.objects.link(s)
            s.location = (-6.5 + i * 1.3, -4.55 + j * 1.3, -.03)
    bpy.data.objects.remove(stud, do_unlink=True)

    O['ocean'] = cube('Ocean', (0, 0, -.6 - 2.5), (400, 400, 5), M['water'], 0)
    # The wave has to read as a wave on mute in frame 1: dark body, stepped curl leaning
    # toward camera, bright foam lip and spray against the pale sky.
    O['wave'] = w = empty('Wave', (0, 9, 0))
    # Read-on-mute wave: stepped face climbing toward the island, dark under-curl and a
    # bright foam lip at the top, seen face-on by the low hook camera.
    steps = [(-4.0, 3.0, M['crest']), (-2.0, 6.0, M['wave']), (0.0, 9.0, M['wave']),
             (2.2, 12.0, M['deepwater']), (4.6, 13.6, M['deepwater'])]
    for k, (y, h, mat) in enumerate(steps):
        p = cube('Wave step %d' % k, (0, 9 + y, h / 2), (30, 2.4, h), mat, .5)
        parent_keep(p, w)
    curl = cube('Wave curl', (0, 9 - 5.4, 13.0), (30, 3.6, 2.6), M['deepwater'], .9)
    curl.rotation_euler.x = math.radians(-18); parent_keep(curl, w)
    lip = cube('Wave foam lip', (0, 9 - 6.6, 13.4), (30, 2.4, 1.7), M['foam'], .8)
    lip.rotation_euler.x = math.radians(-24); parent_keep(lip, w)
    rngw = random.Random(3)
    for k in range(14):   # foam streaks down the face
        x = rngw.uniform(-13, 13); z = rngw.uniform(3.0, 10.5)
        st = cube('Wave foam streak %d' % k, (x, 9 - 3.6, z), (rngw.uniform(.5, 1.6), .5, rngw.uniform(.5, 1.4)), M['foam'], .25)
        parent_keep(st, w)
    for k in range(22):   # spray thrown off the crest
        x = rngw.uniform(-13, 13); z = 13.5 + rngw.uniform(0, 4.0); sz = rngw.uniform(.4, 1.1)
        sp = cube('Wave spray %d' % k, (x, 9 - 7.0 + rngw.uniform(-1.4, 1.4), z), (sz, sz, sz), M['foam'], .2)
        sp.rotation_euler = (rngw.uniform(0, 3), rngw.uniform(0, 3), 0); parent_keep(sp, w)

    # Round one props
    O['tower'] = cube('Tower', (-4.2, 1.6, 3), (2.2, 2.2, 6), M['stone'], .08)
    for z in (1.5, 3.2, 4.9):
        win = cube('Tower window', (-4.2, .48, z), (1.0, .06, .7), M['window'], .02); parent_keep(win, O['tower'])
    top = cube('Tower battlement', (-4.2, 1.6, 6.15), (2.6, 2.6, .3), M['stone'], .05); parent_keep(top, O['tower'])
    O['boat'] = cube('Boat hull', (4.2, -.5, .5), (4.4, 2.6, 1.0), M['boat'], .18)
    for x in (-2.15, 2.15):
        r = cube('Boat rail', (4.2 + x, -.5, 1.25), (.2, 2.6, .55), M['foam'], .06); parent_keep(r, O['boat'])
    bow = cube('Boat bow', (4.2, -1.9, 1.1), (4.0, .3, .7), M['foam'], .1); parent_keep(bow, O['boat'])
    O['crate'] = cube('Floating crate', (0, -.5, .6), (1.8, 1.8, 1.2), M['wood'], .06)
    for zz in (.25, .95):
        p = cube('Crate plank', (0, -1.42, zz), (1.8, .06, .18), M['plank'], .02); parent_keep(p, O['crate'])

    # Round two: meteors, craters, flashes, the wall rock
    O['meteors'], O['craters'], O['flashes'] = [], [], []
    for i in range(10):
        m = sphere('Meteor %d' % i, (0, 0, -80), (.75, .75, .75), M['meteor']); O['meteors'].append(m)
        c = cylinder('Crater %d' % i, (0, 0, -80), 1.0, .08, M['crater'], .02, 20); O['craters'].append(c)
        f = sphere('Impact flash %d' % i, (0, 0, -80), (1, 1, 1), M['flash']); O['flashes'].append(f)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=(0, -2.1, -80))
    rock = bpy.context.object; rock.name = 'Meteor wall rock'; rock.scale = (1.7, .9, 1.35)
    rock.data.materials.append(M['rock']); O['rock'] = rock

    # Round three: tornado and debris
    O['tornado'] = t = empty('Tornado', (12, -2.6, 0))
    for k in range(7):
        z = .9 + k * 1.9; r1 = .5 + k * .5; r2 = .5 + (k + 1) * .5
        seg = cone('Tornado seg %d' % k, (12, -2.6, z), r1, r2, 1.95, M['wind'] if k % 2 == 0 else M['winddark'], 20)
        parent_keep(seg, t)
    rng = random.Random(7)
    for k in range(14):
        a = rng.uniform(0, math.tau); z = rng.uniform(1, 12); r = .9 + z * .28
        d = cube('Tornado debris', (12 + r * math.cos(a), -2.6 + r * math.sin(a), z), (.35, .35, .35), M['plank'] if k % 2 else M['stone'], .03)
        d.rotation_euler = (a, a * 2, 0); parent_keep(d, t)

    # Round four: lava floor and stepping stones
    O['lava'] = cube('Lava floor', (0, 0, -80), (15.4, 11.4, .2), M['lava'], 0)
    for k, (x, y) in enumerate([(-5, 3), (5.5, 3.5), (-3, -3.8), (2.2, 3.4), (-6, -1)]):
        cr = cylinder('Lava crust %d' % k, (x, y, -79.88), .7 + .2 * (k % 3), .06, M['lavadark'], .02, 14); parent_keep(cr, O['lava'])
    O['leo_rock'] = cube('Leo rock platform', (0, -.1, -80), (3.2, 2.6, .9), M['rock'], .12)
    O['mia_stone'] = cube('Mia stepping stone', (4.1, -.5, -80), (1.9, 1.9, .9), M['stone'], .1)
    O['spare_stone'] = cube('Spare stone', (-4.3, 1.5, -80), (1.6, 1.6, .9), M['stone'], .1)

    # --- Lobby (round five) ---------------------------------------------------
    cube('Lobby floor', (LX, 0, -.25), (16, 11, .5), M['lobby'], .1)
    cube('Lobby trim', (LX, -5.6, -.2), (16.2, .3, .6), M['lobbytrim'], .05)
    cube('Shop board', (LX, 3.2, 4.4), (9.5, .4, 5.6), M['panel'], .15)
    label('Shop heading', 'FINAL DISASTER', (LX, 2.95, 6.4), .75, M['white'])
    O['kick_panel'] = cube('Kick panel', (LX, 2.9, 4.4), (7.8, .12, 1.5), M['red'], .08)
    label('Kick text', 'KICK ALL AFK PLAYERS', (LX, 2.78, 4.4), .62, M['white'])
    label('Shop price', '500 COINS', (LX, 2.95, 2.75), .7, M['gold'])
    O['bubble'] = b = empty('Chat bubble', (LX - 2, -1, -80))
    bb = cube('Bubble body', (LX - 2, -1.2, -80 + 0), (3.4, .2, 1.2), M['bubble'], .25); parent_keep(bb, b)
    tail = cube('Bubble tail', (LX - 2.6, -1.2, -80 - .75), (.4, .2, .5), M['bubble'], .05); tail.rotation_euler.y = .6; parent_keep(tail, b)
    txt = label('Bubble text', 'bye Leo', (LX - 2, -1.33, -80), .55, M['ink']); parent_keep(txt, b)
    O['coins'] = [cylinder('Shop coin %d' % i, (0, 0, -80), .3, .1, M['gold'], .02, 20) for i in range(20)]
    for c in O['coins']:
        c.rotation_euler = (math.pi / 2, 0, 0)
    O['zap'] = cylinder('Kick zap beam', (LX, -1, -80), .9, 30, M['beamcore'], 0, 16)
    O['poofs'] = [cube('Poof block %d' % i, (0, 0, -80), (.4, .4, .4), M['white'], .05) for i in range(16)]

    # Scanner, beam, active text, winner, ready button, confetti, AFK tag
    O['scan_shaft'] = cylinder('Scan light shaft', (0, 0, -80), 2.0, 11, M['beam'], 0, 32)
    O['scanner'] = cylinder('Scanner ring', (0, 0, -80), 2.3, .18, M['beamcore'], 0, 40)
    O['beam'] = cylinder('Kick beam up', (0, 0, -80), .6, 40, M['beamcore'], 0, 16)
    O['active'] = label('PLAYER ACTIVE', 'PLAYER ACTIVE', (0, -.6, -80), .8, M['green'])
    O['winner'] = label('WINNER', 'WINNER: LEO', (0, -.8, -80), .78, M['gold'], extrude=.06)
    O['ready'] = r = empty('Ready button', (1.9, -.8, -80))
    for part in [cube('Ready pedestal', (1.9, -.8, -80 + .9), (1.0, 1.0, 1.8), M['pedestal'], .08),
                 label('Ready text', 'READY', (1.9, -1.33, -80 + 1.2), .28, M['white'])]:
        parent_keep(part, r)
    O['ready_cap'] = cylinder('Ready cap', (1.9, -.8, -80 + 1.9), .42, .2, M['ready'], .04, 32)
    confetti_mats = [glow('Confetti %s' % c, c, .6) for c in ('FF4D6D', 'FFD166', '06D6A0', '4CC9F0', 'B388FF')]
    O['confetti'] = [cube('Confetti %d' % i, (0, 0, -80), (.3, .3, .06), confetti_mats[i % 5], 0) for i in range(40)]
    O['afk'] = a = empty('AFK tag', (0, 0, -80))
    plate = cube('AFK plate', (0, .02, -80), (1.5, .12, .7), M['ink'], .12); parent_keep(plate, a)
    txt = label('AFK text', 'AFK', (0, -.08, -80), .45, M['white']); parent_keep(txt, a)
    return M, O
