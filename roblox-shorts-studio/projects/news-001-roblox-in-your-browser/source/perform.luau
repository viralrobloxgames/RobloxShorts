--!nocheck
-- Skye's performance player for ViralRoblox News #1 (generated from this template by source/performance.py).
-- Runs in Studio EDIT mode through the MCP (execute_luau): every part of Skye stays anchored and this script places
-- them by forward kinematics each RenderStepped, because her joints are AnimationConstraints and moving unanchored
-- parts in Edit makes the solver twist her. One take per camera: set CAM, run, screen-record the viewport.
-- The take starts with LEAD seconds of a white card over the lens; the first non-white frame is t = 0.

local CAM = "M"   -- W | M | C
local LEAD = 1.5
local START_AT = 0   -- preview from later in the take (0 for a recording)
local SPEED = 0.5    -- performance plays at half speed; the recording is sped back up in post (cleaner frames)
local VISEMES_RLE = "U13C7S1T1O6T4O3T2S1C1T2O1S2C2O5S3T1W3S5T1E2W1T1B3C3S5O1W2O1S2O1T2S2C5H24C5T5S4C3S5C2S1T2W8O3W2O1S1C1O1W3T1C1S7C2B3H55E1W2T1C2T1W5O1S1T1O3S3C11O1W2O4W3S8C3S2T8O1S1E2S1W3O2B1S1O2S1C1T1W2T1S3C2H14C2O2W2S2W4T1C1S4T3E2T1S3C2T2O2S3O1W3T1S1C2S2T3S3C10W3O1T2W2T1O1W2C1S1W3S5E2T2C1B3C2S2T1W1O2S2T4S9T2E1S4E3T1O1S3O1T3O3W5O1S1T1W4T1O1S1C2T1W1C3H15B3H18W5E3W1C12S1E1W2O2T3O3S2C5H14O3W2O1S1T1W4O1S1T6B2T3S6E3T1C3H30C1S1T5S1C2T1W5O1S3C1T1W3S16C14S2E1W3T1S1C11S1E1T1S5B3C9W1S1C10T2S7C3S5T1W3T1S7C3T1W1E2T1C11B3C2S1W2T1C1S1E3S4C3S1T4S4W3S1C2S1T2E1S4T2S3C3H42U22H5B3H11E1T1S1C2S1T1E4S4C2T2S4C2S3E2S1C17E3S2C2S4T6S9T2S8T3C1S5T2O5S2O6S3B1T2S1C2S1O3S5C3S3T1W1O2T1S3C7H17S6C2S4T2C17S14C2B3C13T1E1S4C3H17T3S1C3S4C3S4O1T3C1S3T2S3C3S2C4S3T3C1S2B3C8O3C3S1T3O2T1E1S3E1W1T1C2S3T2S4T2S11C3H30B3H3S2O1W2O3C9S2O1T1S3O2S1C2O1T2S5T2O1S12C16S1T5C3S1T4S12T6S1B2O1T3S1C1O8W3T1C13S2E4S1C10T1O4T5S2O1T2E1S2C2S3C3S1O1T3O1S5C4H7B3H24T1W2O5S2O1W4O12W2S6T4S15T2W3T2O1S1T2S2C2O1W2O3W3S8B3H27S4E1T1S3T3S2O6T1W2S12T2W3O1S2T3O1S1C3S1O5S8C2S2C2S2T6S1B3C13T1W2T5S1C1T2O2W3C3H29T1E2T1S4C1T1W3T1E1S2C7S4T2S1C2W2T1O1S2C1O1T1W4O4S2O4S2O1W2T1C1S13B3C6T1W3O1T1W1O1S3T1O1S1T1O3W1C3H47"
local NODS = {0.0, 1.38, 2.58, 3.98, 7.86, 9.7, 11.24, 12.52, 13.72, 15.7, 17.76, 19.56, 22.04, 23.64, 24.94, 26.3, 27.82, 30.1, 31.46, 32.88, 34.96, 36.92, 39.88, 42.2, 44.64, 46.8, 48.22, 49.64, 52.18, 54.06, 56.06, 57.34, 59.18, 60.88, 62.06, 63.9}
local GESTURES = {{17.71, "B", 0.7}, {18.33, "B", 0.7}, {22.9, "R", 0.8}, {23.59, "L", 0.6}, {25.57, "R", 0.6}, {31.41, "B", 0.8}, {44.59, "B", 0.9}, {50.56, "R", 0.9}, {52.13, "B", 1.0}, {56.46, "L", 0.8}, {59.13, "R", 0.8}}
local WAVE_AT = 60.73
local SECONDS = 66.0
local VISEMES = (function() local o = {}; for k, n in VISEMES_RLE:gmatch("(%a)(%d+)") do o[#o + 1] = string.rep(k, tonumber(n)) end; return table.concat(o) end)()
local FPS = 30
local FACES = { C = "mouth_closed", S = "mouth_small", T = "talking", W = "mouth_wide", E = "mouth_e", O = "mouth_o",
	B = "blink_closed", U = "surprised", H = "happy" }
local CAMS = {
	W = { pos = Vector3.new(0, 6.0, 486), look = Vector3.new(0, 4.9, 500), fov = 44 },
	M = { pos = Vector3.new(0, 4.75, 492.4), look = Vector3.new(0, 4.55, 500), fov = 34 },
	C = { pos = Vector3.new(0, 5.25, 495.4), look = Vector3.new(0, 5.0, 500), fov = 34 },
}

local RunService = game:GetService("RunService")
local root = workspace.ViralNews
local skye = root.Skye
local hrp = skye.HumanoidRootPart
local takeId = tostring(os.clock())
root:SetAttribute("TakeId", takeId) -- the plugin sandbox has no _G: an older take sees a new id and stops itself
for _, p in skye:GetDescendants() do if p:IsA("BasePart") then p.Anchored = true end end

-- faces: one decal per viseme, switched by Transparency so nothing loads mid-take
local head = skye.Head
local decals, list = {}, {}
for k, name in FACES do
	local d = head:FindFirstChild("v_" .. k) or Instance.new("Decal")
	d.Name = "v_" .. k; d.Face = Enum.NormalId.Front
	d.Texture = skye.Faces:GetAttribute(name) or ""; d.Transparency = 1; d.Parent = head
	decals[k] = d; table.insert(list, d)
end
if head:FindFirstChild("face") then head.face.Transparency = 1 end
game:GetService("ContentProvider"):PreloadAsync(list)

-- rig: every part back to its stored rest pose (RestCF, relative to the root; the arms got theirs from the booth
-- build, the rest are recorded on the first run while still at rest), then cache each joint's rest relation
for _, p in skye:GetDescendants() do
	if p:IsA("BasePart") and p ~= hrp then
		local rest = p:GetAttribute("RestCF")
		if rest then p.CFrame = hrp.CFrame * rest else p:SetAttribute("RestCF", hrp.CFrame:ToObjectSpace(p.CFrame)) end
	end
end
local ORDER = { "Root", "Waist", "Neck", "LeftShoulder", "LeftElbow", "LeftWrist", "RightShoulder", "RightElbow",
	"RightWrist", "LeftHip", "LeftKnee", "LeftAnkle", "RightHip", "RightKnee", "RightAnkle" }
local joints = {}
for _, name in ORDER do
	local j
	for _, d in skye:GetDescendants() do
		if d.Name == name and (d:IsA("AnimationConstraint") or d:IsA("Motor6D")) then j = d; break end
	end
	if j then
		local a0, a1 = j.Attachment0 or nil, j.Attachment1 or nil
		local p0, p1, c0, c1
		if j:IsA("Motor6D") then p0, p1, c0, c1 = j.Part0, j.Part1, j.C0, j.C1
		else p0, p1, c0, c1 = a0.Parent, a1.Parent, a0.CFrame, a1.CFrame end
		local r0 = (p0.CFrame * c0):ToObjectSpace(p1.CFrame * c1)
		table.insert(joints, { name = name, p0 = p0, p1 = p1, c0 = c0, c1i = c1:Inverse(), r0 = r0 })
	end
end
local riders = {} -- accessory handles follow the body part they are welded to
for _, acc in skye:GetChildren() do
	if acc:IsA("Accessory") and acc:FindFirstChild("Handle") then
		local h = acc.Handle
		local rc = h:FindFirstChildWhichIsA("RigidConstraint")
		local body = rc and rc.Attachment0 and rc.Attachment1 and ((rc.Attachment0.Parent == h) and rc.Attachment1.Parent or rc.Attachment0.Parent)
		if body then table.insert(riders, { h = h, body = body, off = body.CFrame:ToObjectSpace(h.CFrame) }) end
	end
end

-- motion ------------------------------------------------------------------------------------------------
local rad, sin, pi = math.rad, math.sin, math.pi
local function noise(t, s) return 0.5 * sin(t * 1.3 + s) + 0.3 * sin(t * 2.1 + s * 1.7) + 0.2 * sin(t * 3.7 + s * 2.3) end
local function clamp01(x) return math.max(0, math.min(1, x)) end
local function smooth(x) x = clamp01(x); return x * x * (3 - 2 * x) end
local function pulse(t, t0, d) local p = (t - t0) / d; if p < 0 or p > 1 then return 0 end; return sin(pi * p) end
local function ang(x, y, z) return CFrame.Angles(rad(x), rad(y), rad(z)) end

local function pose(t)
	local P = {}
	local nod = 0
	for _, n in NODS do nod += pulse(t, n - 0.05, 0.42) end
	P.Waist = ang(0.8 * sin(2 * pi * t / 3.6) + 1.2 * noise(t * 0.4, 9), 1.6 * noise(t * 0.35, 4), 1.0 * noise(t * 0.45, 5))
	P.Neck = ang(1.6 * noise(t * 0.7, 3) - 5 * nod, 4.5 * noise(t * 0.55, 1), 2.6 * noise(t * 0.5, 2))
	local lift = { L = 0, R = 0 }
	for _, g in GESTURES do
		local e = pulse(t, g[1], g[3])
		if g[2] ~= "R" then lift.L += e end
		if g[2] ~= "L" then lift.R += e end
	end
	local w = smooth((t - WAVE_AT) / 0.45)
	for _, side in { "Left", "Right" } do
		local s = side == "Left" and 1 or -1
		local l = math.min(1, lift[side:sub(1, 1)])
		local sx, sz, ex, ez = 20 + 8 * l, 6 * s, 50 + 30 * l, 0
		if side == "Right" and w > 0 then
			-- classic wave: upper arm out to the side, forearm up, the hand waving from the elbow
			local wag = 16 * sin(2 * pi * 2.0 * (t - WAVE_AT))
			sx, sz = sx + (8 - sx) * w, sz + (82 - sz) * w
			ex, ez = ex + (0 - ex) * w, ez + (40 + wag) * w
		end
		P[side .. "Shoulder"] = ang(sx, 0, sz)
		P[side .. "Elbow"] = ang(ex, 0, ez)
		P[side .. "Wrist"] = ang(-6 * l, 0, 0)
	end
	return P
end

local parts, cfs = {}, {}
local function apply(t)
	local P = pose(t)
	table.clear(parts); table.clear(cfs)
	local placed = { [hrp] = hrp.CFrame }
	for _, j in joints do
		local p0cf = placed[j.p0] or j.p0.CFrame
		local cf = p0cf * j.c0 * (P[j.name] or CFrame.identity) * j.r0 * j.c1i
		placed[j.p1] = cf
		table.insert(parts, j.p1); table.insert(cfs, cf)
	end
	for _, r in riders do
		local b = placed[r.body] or r.body.CFrame
		table.insert(parts, r.h); table.insert(cfs, b * r.off)
	end
	workspace:BulkMoveTo(parts, cfs, Enum.BulkMoveMode.FireCFrameChanged)
end

local current
local function face(k)
	if k == current then return end
	if current then decals[current].Transparency = 1 end
	decals[k].Transparency = 0; current = k
end

-- camera + sync card ------------------------------------------------------------------------------------
game:GetService("Selection"):Set({})
local cam = workspace.CurrentCamera
local spec = CAMS[CAM]
cam.CameraType = Enum.CameraType.Scriptable
cam.FieldOfView = spec.fov
cam.CFrame = CFrame.lookAt(spec.pos, spec.look) * CFrame.Angles(0, 0, rad(90))
local card = root:FindFirstChild("_SyncCard") or Instance.new("Part")
card.Name = "_SyncCard"; card.Anchored = true; card.CanCollide = false; card.Material = Enum.Material.Neon
card.Color = Color3.new(1, 1, 1); card.Size = Vector3.new(6, 6, 0.05); card.CastShadow = false
card.CFrame = cam.CFrame * CFrame.new(0, 0, -0.6); card.Transparency = 0; card.Parent = root

apply(START_AT); face(VISEMES:sub(1, 1))
local t0 = os.clock() + LEAD
local conn
conn = RunService.RenderStepped:Connect(function()
	if root:GetAttribute("TakeId") ~= takeId then conn:Disconnect(); return end
	local t = (os.clock() - t0) * SPEED + START_AT
	if t < START_AT then return end
	if card.Transparency < 1 then card.Transparency = 1 end
	if t > SECONDS + 0.5 then conn:Disconnect(); return end
	apply(t)
	local i = math.clamp(math.floor(t * FPS) + 1, 1, #VISEMES)
	face(VISEMES:sub(i, i))
end)
return "take " .. CAM .. " running: " .. #joints .. " joints, " .. #riders .. " accessories, visemes " .. #VISEMES
