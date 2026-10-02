--!nocheck
-- Build the ViralRoblox News set around Skye in Workspace.ViralNews (rebuilds Booth from scratch each run).
-- Run through the Studio MCP (execute_luau, Edit). The set faces -Z: cameras sit at low Z looking +Z at Skye.
-- v2 (2026-10-01): pink TV-newsroom look from real news-set references: tiered round platform with neon rings,
-- curved anchor desk with a front logo screen, wraparound LED wall with light columns, overhead halo ring.
--
--   Booth.Platform / Desk / VideoWall / Halo / Columns / Room / Lights / Cameras
--   Brand wall:  Booth.VideoWall.Centre.SurfaceGui.Image          (tools/make_news_wall.py)
--   Story image: Booth.VideoWall.SideL.SurfaceGui.Frame.Story.Image (also the Booth attribute "StoryImage")
--   Camera marks: Booth.Cameras.<Wide|Medium|CloseUp>, CFrame + attribute LookAt (for screen_capture)

-- CONFIG --------------------------------------------------------------------------------------------
local STORY_IMAGE = "rbxassetid://86820019915207"    -- episode story card (16:9) on the screen-left wall panel
local BRAND_WALL = "rbxassetid://130008381889396"    -- decals/news_wall_brand.png
local ORIGIN = Vector3.new(0, 0, 500)                 -- where Skye stands (floor level)
local POSE_ARMS = true                                -- rest Skye's hands on the desk
-------------------------------------------------------------------------------------------------------

local rgb = Color3.fromRGB
local HOT = rgb(255, 64, 160)
local PINK_L = rgb(255, 196, 228)
local PURPLE = rgb(150, 70, 255)
local PLUM = rgb(66, 24, 92)
local PLUM_D = rgb(26, 10, 38)
local WHITE = rgb(252, 248, 252)
local RED = rgb(230, 30, 50)
local PLATFORM_H = 0.4
-- no Reflectance anywhere: it mirrors the place's blue skybox and turns the pink set blue

local root = workspace:FindFirstChild("ViralNews") or Instance.new("Folder")
root.Name = "ViralNews"; root.Parent = workspace
local old = root:FindFirstChild("Booth"); if old then old:Destroy() end
local booth = Instance.new("Model"); booth.Name = "Booth"
booth:SetAttribute("StoryImage", STORY_IMAGE)

local O = ORIGIN
local function v(x, y, z) return O + Vector3.new(x, y, z) end
local up = CFrame.Angles(0, 0, math.pi / 2)

local function part(parent, name, props)
	local p = Instance.new("Part")
	p.Name = name; p.Anchored = true; p.CanCollide = props.CanCollide or false
	p.TopSurface = Enum.SurfaceType.Smooth; p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = props.Material or Enum.Material.SmoothPlastic
	for k, val in props do if k ~= "CanCollide" and k ~= "Material" then p[k] = val end end
	p.CastShadow = props.CastShadow ~= false and p.Material ~= Enum.Material.Neon
	p.Parent = parent
	return p
end
local function neon(parent, name, props) props.Material = Enum.Material.Neon; props.Color = props.Color or HOT; return part(parent, name, props) end
local function group(name, parent) local m = Instance.new("Model"); m.Name = name; m.Parent = parent or booth; return m end
local function disc(parent, name, dia, h, y, color, props)
	props = props or {}
	props.Shape = Enum.PartType.Cylinder; props.Size = Vector3.new(h, dia, dia)
	props.CFrame = CFrame.new(v(0, y, -0.8)) * up; props.Color = color
	return part(parent, name, props)
end
local function surface(p, face, ppS)
	local g = Instance.new("SurfaceGui"); g.Face = face or Enum.NormalId.Front
	g.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud; g.PixelsPerStud = ppS or 100
	g.LightInfluence = 0; g.Brightness = 1.3; g.ZIndexBehavior = Enum.ZIndexBehavior.Sibling; g.Parent = p
	return g
end
local function frame(parent, props)
	local f = Instance.new(props.class or "Frame"); f.BorderSizePixel = 0
	for k, val in props do if k ~= "class" and k ~= "corner" and k ~= "stroke" then f[k] = val end end
	if props.corner then local c = Instance.new("UICorner"); c.CornerRadius = props.corner; c.Parent = f end
	f.Parent = parent
	return f
end
local function label(parent, text, props)
	props.class = "TextLabel"; props.Text = text; props.BackgroundTransparency = props.BackgroundTransparency or 1
	props.Font = props.Font or Enum.Font.LuckiestGuy; props.TextScaled = true
	props.TextColor3 = props.TextColor3 or WHITE
	local l = frame(parent, props)
	if props.stroke ~= false then
		local s = Instance.new("UIStroke"); s.Thickness = 3; s.Color = PLUM_D; s.Parent = l
	end
	return l
end
local function gradient(f, a, b, rot)
	local g = Instance.new("UIGradient"); g.Color = ColorSequence.new(a, b); g.Rotation = rot or 90; g.Parent = f
end
-- "ViralRoblox NEWS" lockup
local function logo(parent, pos, size, textColor)
	local box = frame(parent, { Position = pos, Size = size, BackgroundTransparency = 1 })
	label(box, "ViralRoblox", { Size = UDim2.fromScale(1, 0.5), TextColor3 = textColor or WHITE, stroke = false })
	local badge = frame(box, { Position = UDim2.fromScale(0.2, 0.54), Size = UDim2.fromScale(0.6, 0.44), BackgroundColor3 = RED, corner = UDim.new(0.15, 0) })
	label(badge, "NEWS", { Position = UDim2.fromScale(0.05, 0.08), Size = UDim2.fromScale(0.9, 0.84), stroke = false })
	return box
end

-- Room: dark plum so the neon and the screens carry the colour ----------------------------------------
local room = group("Room")
part(room, "Floor", { Size = Vector3.new(60, 1, 46), Position = v(0, -0.5, -4), Color = rgb(54, 16, 60), CanCollide = true })
part(room, "Ceiling", { Size = Vector3.new(60, 1, 46), Position = v(0, 18.5, -4), Color = PLUM_D })
part(room, "WallL", { Size = Vector3.new(1, 19, 46), Position = v(-30.5, 9, -4), Color = PLUM_D })
part(room, "WallR", { Size = Vector3.new(1, 19, 46), Position = v(30.5, 9, -4), Color = PLUM_D })
part(room, "WallFront", { Size = Vector3.new(62, 19, 1), Position = v(0, 9, -27.5), Color = PLUM_D })
part(room, "WallBack", { Size = Vector3.new(62, 19, 1), Position = v(0, 9, 19.5), Color = PLUM_D })

-- Platform: two tiers with neon edges, plus glowing rings on the floor --------------------------------
local plat = group("Platform")
for i, d in { 21, 16.5 } do
	disc(plat, "FloorRingGlow" .. i, d + 0.4, 0.02, 0.01, HOT, { Material = Enum.Material.Neon })
	disc(plat, "FloorRingCut" .. i, d, 0.03, 0.015, rgb(54, 16, 60), {})
end
disc(plat, "Tier1Glow", 13.3, 0.16, 0.08, PURPLE, { Material = Enum.Material.Neon })
disc(plat, "Tier1", 13, 0.2, 0.1, rgb(140, 36, 120), { CanCollide = true })
disc(plat, "Tier2Glow", 9.8, 0.36, 0.18, HOT, { Material = Enum.Material.Neon })
disc(plat, "Tier2", 9.5, 0.2, 0.3, WHITE, { CanCollide = true })

-- Desk: curved around Skye, white top, plum body, logo screen on the front ----------------------------
local desk = group("Desk")
local RF, DEPTH, TOP = 2.6, 1.3, PLATFORM_H + 2.9
local SPAN, N = math.rad(84), 15
local bodyH = TOP - PLATFORM_H
for i = 0, N - 1 do
	local a = -SPAN + (i + 0.5) * (2 * SPAN / N)
	local out = Vector3.new(math.sin(a), 0, -math.cos(a))
	local w = 2 * RF * math.sin(SPAN / N) + 0.06
	local function at(y, r) local p = Vector3.new(O.X, 0, O.Z) + out * r + Vector3.new(0, y, 0); return CFrame.lookAt(p, p + out) end
	part(desk, "Body" .. i, { Size = Vector3.new(w, bodyH, DEPTH), CFrame = at(PLATFORM_H + bodyH / 2, RF - DEPTH / 2), Color = PLUM, CanCollide = true })
	part(desk, "Top" .. i, { Size = Vector3.new(w + 0.08, 0.14, DEPTH + 0.35), CFrame = at(TOP + 0.07, RF - DEPTH / 2 + 0.12), Color = HOT })  -- hot pink, not white: a white top merged into Skye's white blouse
	neon(desk, "TopStrip" .. i, { Size = Vector3.new(w + 0.02, 0.06, 0.04), CFrame = at(TOP - 0.03, RF + 0.3), Color = PURPLE })
	neon(desk, "BaseStrip" .. i, { Size = Vector3.new(w, 0.08, 0.04), CFrame = at(PLATFORM_H + 0.2, RF + 0.01), Color = PURPLE })
	if i % 2 == 1 and math.abs(a) > 0.5 then
		neon(desk, "Rib" .. i, { Size = Vector3.new(0.05, bodyH - 0.5, 0.04), CFrame = at(PLATFORM_H + bodyH / 2, RF + 0.01) })
	end
end
do -- front logo screen, standing slightly proud of the curve
	local cf = CFrame.lookAt(v(0, PLATFORM_H + 1.55, -RF - 0.2), v(0, PLATFORM_H + 1.55, -RF - 1.2))
	neon(desk, "LogoGlow", { Size = Vector3.new(2.75, 1.6, 0.05), CFrame = cf * CFrame.new(0, 0, 0.06) })
	local screen = part(desk, "LogoScreen", { Size = Vector3.new(2.6, 1.45, 0.08), CFrame = cf, Color = rgb(10, 4, 16) })
	local g = surface(screen, Enum.NormalId.Front, 150)
	local bg = frame(g, { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(1, 1, 1) })
	gradient(bg, rgb(255, 92, 176), rgb(120, 40, 170), 90)
	logo(bg, UDim2.fromScale(0.1, 0.16), UDim2.fromScale(0.8, 0.68))
end
local props = group("Props", desk)
local mugP = v(1.25, TOP + 0.31, -RF + 0.55)
part(props, "Mug", { Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.34, 0.28, 0.28), CFrame = CFrame.new(mugP) * up, Color = WHITE })
neon(props, "MugBand", { Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.08, 0.29, 0.29), CFrame = CFrame.new(mugP) * up })
local tab = CFrame.new(v(-1.15, TOP + 0.155, -RF + 0.6)) * CFrame.Angles(0, math.rad(20), 0)
part(props, "Tablet", { Size = Vector3.new(0.72, 0.03, 0.5), CFrame = tab, Color = rgb(20, 16, 26) })
neon(props, "TabletScreen", { Size = Vector3.new(0.65, 0.01, 0.43), CFrame = tab * CFrame.new(0, 0.02, 0), Color = PINK_L })
part(props, "Papers", { Size = Vector3.new(0.5, 0.03, 0.66), CFrame = CFrame.new(v(-0.5, TOP + 0.155, -RF + 0.62)) * CFrame.Angles(0, math.rad(-8), 0), Color = WHITE })

-- Wraparound LED wall: brand centre panel, story panel screen-left, BREAKING panel screen-right -------
local wall = group("VideoWall")
local WZ, WY = 7.5, 5.6
local function wallPanel(name, cf, w, h)
	part(wall, name .. "Bezel", { Size = Vector3.new(w + 0.2, h + 0.2, 0.25), CFrame = cf * CFrame.new(0, 0, 0.15), Color = rgb(8, 4, 12) })
	local p = part(wall, name, { Size = Vector3.new(w, h, 0.1), CFrame = cf, Color = Color3.new(0, 0, 0) })
	return p, surface(p, Enum.NormalId.Front, 100)
end
local centreCF = CFrame.lookAt(v(0, WY, WZ), v(0, WY, -10))
local cw, ch = 10.4, 5.85
do
	local p, g = wallPanel("Centre", centreCF, cw, ch)
	frame(g, { class = "ImageLabel", Name = "Image", Size = UDim2.fromScale(1, 1), Image = BRAND_WALL, ScaleType = Enum.ScaleType.Crop, BackgroundColor3 = PLUM })
	for c = 1, 3 do frame(g, { Position = UDim2.new(c / 4, -1, 0, 0), Size = UDim2.new(0, 2, 1, 0), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.55 }) end
	for r = 1, 2 do frame(g, { Position = UDim2.new(0, 0, r / 3, -1), Size = UDim2.new(1, 0, 0, 2), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.55 }) end
	local s = Instance.new("SurfaceLight"); s.Face = Enum.NormalId.Front; s.Color = PINK_L; s.Brightness = 0.8; s.Range = 12; s.Angle = 120; s.Parent = p
end
local sw = 5.4
for _, side in { 1, -1 } do -- world +X is screen left
	local hinge = v(side * (cw / 2 + 0.55), WY, WZ)
	local ang = math.rad(38)
	local dir = Vector3.new(side * math.cos(ang), 0, -math.sin(ang))
	local mid = hinge + dir * (sw / 2)
	local outward = Vector3.new(-side * math.sin(ang), 0, -math.cos(ang))
	local cf = CFrame.lookAt(mid, mid + outward)
	local name = side > 0 and "SideL" or "SideR"
	local _, g = wallPanel(name, cf, sw, ch)
	if side > 0 then
		local bg = frame(g, { Size = UDim2.fromScale(1, 1), BackgroundColor3 = PLUM })
		frame(bg, { class = "ImageLabel", Name = "Story", Position = UDim2.fromScale(0.05, 0.2), Size = UDim2.fromScale(0.9, 0.6), Image = STORY_IMAGE, ScaleType = Enum.ScaleType.Crop, BackgroundColor3 = Color3.new(0, 0, 0) })
		local bar = frame(bg, { Position = UDim2.fromScale(0.05, 0.05), Size = UDim2.fromScale(0.5, 0.12), BackgroundColor3 = RED })
		label(bar, "TOP STORY", { Position = UDim2.fromScale(0.06, 0.1), Size = UDim2.fromScale(0.88, 0.8), stroke = false })
		label(bg, "VIRALROBLOX NEWS", { Position = UDim2.fromScale(0.05, 0.84), Size = UDim2.fromScale(0.9, 0.1), TextColor3 = PINK_L, stroke = false })
	else
		local bg = frame(g, { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(1, 1, 1) })
		gradient(bg, rgb(120, 30, 160), rgb(255, 64, 160), 90)
		local bar = frame(bg, { Position = UDim2.fromScale(0, 0.3), Size = UDim2.fromScale(1, 0.2), BackgroundColor3 = RED })
		label(bar, "BREAKING", { Position = UDim2.fromScale(0.08, 0.1), Size = UDim2.fromScale(0.84, 0.8) })
		label(bg, "NEWS", { Position = UDim2.fromScale(0.15, 0.52), Size = UDim2.fromScale(0.7, 0.2) })
		label(bg, "FOLLOW @viralrobloxgames", { Position = UDim2.fromScale(0.06, 0.82), Size = UDim2.fromScale(0.88, 0.08), Font = Enum.Font.GothamBold, stroke = false, TextColor3 = PINK_L })
	end
	-- light columns at the hinge and the outer edge
	neon(wall, name .. "ColIn", { Size = Vector3.new(0.18, ch + 1.4, 0.18), Position = hinge + Vector3.new(0, 0, 0.1) })
	neon(wall, name .. "ColOut", { Size = Vector3.new(0.18, ch + 1.4, 0.18), Position = hinge + dir * (sw + 0.3) })
end
do -- LED ticker band across the top of the centre panel
	local cf = centreCF * CFrame.new(0, ch / 2 + 0.6, 0)
	part(wall, "BandBezel", { Size = Vector3.new(cw + 0.2, 0.9, 0.25), CFrame = cf * CFrame.new(0, 0, 0.15), Color = rgb(8, 4, 12) })
	local band = part(wall, "Band", { Size = Vector3.new(cw, 0.7, 0.1), CFrame = cf, Color = Color3.new(0, 0, 0) })
	local g = surface(band, Enum.NormalId.Front, 100)
	local bg = frame(g, { Size = UDim2.fromScale(1, 1), BackgroundColor3 = HOT })
	label(bg, "VIRALROBLOX NEWS  •  DAILY ROBLOX NEWS  •  FOLLOW @VIRALROBLOXGAMES", { Position = UDim2.fromScale(0.02, 0.12), Size = UDim2.fromScale(0.96, 0.76), stroke = false })
end

-- Overhead halo rings ------------------------------------------------------------------------------------
local halo = group("Halo")
for ri, spec in { { r = 6, y = 10.3, n = 36, c = HOT }, { r = 4.2, y = 10.6, n = 28, c = PURPLE } } do
	for k = 0, spec.n - 1 do
		local a = k / spec.n * 2 * math.pi
		local p = v(spec.r * math.cos(a), spec.y, -0.8 + spec.r * math.sin(a))
		local tangent = Vector3.new(-math.sin(a), 0, math.cos(a))
		neon(halo, "Ring" .. ri .. "_" .. k, { Size = Vector3.new(0.22, 0.22, 2 * math.pi * spec.r / spec.n + 0.04), CFrame = CFrame.lookAt(p, p + tangent), Color = spec.c })
	end
end
-- light columns framing the wide shot
local cols = group("Columns")
for _, x in { -15, -11, 11, 15 } do
	neon(cols, "Col" .. x, { Size = Vector3.new(0.3, 12, 0.3), Position = v(x, 6, 4 - math.abs(x) * 0.5), Color = math.abs(x) == 11 and HOT or PURPLE })
end

-- Lights -------------------------------------------------------------------------------------------------
local lights = group("Lights")
local function lamp(name, pos, target, kind, lprops)
	local p = part(lights, name, { Size = Vector3.new(0.6, 0.6, 0.9), CFrame = CFrame.lookAt(pos, target), Color = rgb(30, 26, 36), Material = Enum.Material.Metal, CastShadow = false, Transparency = 1 })
	local l = Instance.new(kind); l.Shadows = true
	for k, val in lprops do l[k] = val end
	if kind == "SpotLight" then l.Face = Enum.NormalId.Front end
	l.Parent = p
	return p
end
local head = v(0, PLATFORM_H + 4.7, 0)
lamp("Key", v(4, 12, -9), head, "SpotLight", { Brightness = 7, Range = 28, Angle = 38, Color = rgb(255, 246, 240) })
lamp("Fill", v(-5, 10, -8), head, "SpotLight", { Brightness = 2.5, Range = 22, Angle = 55, Color = rgb(255, 225, 240), Shadows = false })
lamp("RimL", v(4, 12, 4), head, "SpotLight", { Brightness = 9, Range = 18, Angle = 40, Color = HOT })
lamp("RimR", v(-4, 12, 4), head, "SpotLight", { Brightness = 9, Range = 18, Angle = 40, Color = PURPLE })
lamp("Wash", v(0, 15, -2), v(0, 0, 0), "PointLight", { Brightness = 1.2, Range = 30, Color = rgb(255, 170, 220), Shadows = false })

-- Camera marks ---------------------------------------------------------------------------------------------
local camsF = Instance.new("Folder"); camsF.Name = "Cameras"; camsF.Parent = booth
local function cam(name, pos, look)
	local p = part(camsF, name, { Size = Vector3.new(0.4, 0.4, 0.6), CFrame = CFrame.lookAt(pos, look), Transparency = 1, CastShadow = false })
	p:SetAttribute("LookAt", look)
	p.Locked = true
end
cam("Wide", v(0, 7, -17), v(0, 5, 3))
cam("Medium", v(0, 5.3, -7.2), v(0, 4.9, 0))
cam("CloseUp", v(0, 5.3, -3.8), v(0, 5.15, 0))

booth.PrimaryPart = room.Floor
booth.Parent = root

-- Skye: anchored throughout (her joints are AnimationConstraints, and moving unanchored parts in Edit makes the
-- solver twist the whole body), stood on the platform facing the cameras, hands resting on the desk.
local skye = root:FindFirstChild("Skye")
if skye then
	for _, p in skye:GetDescendants() do if p:IsA("BasePart") then p.Anchored = true end end
	skye:PivotTo(CFrame.lookAt(v(0, 3.5 + PLATFORM_H, 0), v(0, 3.5 + PLATFORM_H, -1)))
	local hrp = skye.HumanoidRootPart
	for _, side in { "Left", "Right" } do
		local ua, la, hand = skye[side .. "UpperArm"], skye[side .. "LowerArm"], skye[side .. "Hand"]
		for _, p in { ua, la, hand } do -- back to the rest pose first, so re-runs don't stack rotations
			local rest = p:GetAttribute("RestCF")
			if rest == nil then p:SetAttribute("RestCF", hrp.CFrame:ToObjectSpace(p.CFrame)) else p.CFrame = hrp.CFrame * rest end
		end
		if POSE_ARMS then
			local s = side == "Left" and 1 or -1
			local J = CFrame.new((skye.UpperTorso.CFrame * skye.UpperTorso[side .. "ShoulderRigAttachment"].CFrame).Position) * skye.UpperTorso.CFrame.Rotation
			local R = J * CFrame.Angles(math.rad(20), 0, math.rad(6) * s) * J:Inverse()
			for _, p in { ua, la, hand } do p.CFrame = R * p.CFrame end
			local E = CFrame.new((ua.CFrame * ua[side .. "ElbowRigAttachment"].CFrame).Position) * ua.CFrame.Rotation
			local R2 = E * CFrame.Angles(math.rad(50), 0, 0) * E:Inverse()
			for _, p in { la, hand } do p.CFrame = R2 * p.CFrame end
		end
	end
end
return "booth v2 built: " .. #booth:GetDescendants() .. " instances"
