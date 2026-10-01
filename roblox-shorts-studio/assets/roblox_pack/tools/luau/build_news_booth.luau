--!nocheck
-- Build the ViralRoblox News booth around Skye in Workspace.ViralNews (rebuilds Booth from scratch each run).
-- Run through the Studio MCP (execute_luau, Edit). The set faces -Z: cameras sit at low Z looking +Z at Skye.
--
--   Booth.Dais / Desk / VideoWall / Backdrop / PanelLogo / PanelFollow / Room / Lights / Cameras
--   Story image: Booth.VideoWall.Screen.SurfaceGui.Story.Image  (also the Booth attribute "StoryImage")
--   Camera marks: Booth.Cameras.<Wide|Medium|CloseUp>, CFrame + attribute LookAt (for screen_capture)

-- CONFIG --------------------------------------------------------------------------------------------
local STORY_IMAGE = "rbxassetid://117471170185339"   -- episode wall image (16:9)
local ORIGIN = Vector3.new(0, 0, 500)                 -- where Skye stands (floor level)
local DAIS_H = 0.3
-------------------------------------------------------------------------------------------------------

local NAVY = Color3.fromRGB(11, 22, 48)
local NAVY_MID = Color3.fromRGB(19, 38, 82)
local NAVY_DESK = Color3.fromRGB(16, 32, 74)
local CYAN = Color3.fromRGB(0, 214, 255)
local RED = Color3.fromRGB(230, 30, 50)
local WHITE = Color3.fromRGB(236, 242, 255)
local YELLOW = Color3.fromRGB(255, 212, 0)

local root = workspace:FindFirstChild("ViralNews") or Instance.new("Folder")
root.Name = "ViralNews"; root.Parent = workspace
local old = root:FindFirstChild("Booth"); if old then old:Destroy() end
local booth = Instance.new("Model"); booth.Name = "Booth"
booth:SetAttribute("StoryImage", STORY_IMAGE)

local O = ORIGIN
local function v(x, y, z) return O + Vector3.new(x, y, z) end

local function part(parent, name, props)
	local p = Instance.new(props.Shape and "Part" or (props.class or "Part"))
	p.Name = name; p.Anchored = true; p.CanCollide = props.CanCollide or false
	p.TopSurface = Enum.SurfaceType.Smooth; p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = props.Material or Enum.Material.SmoothPlastic
	for k, val in props do if k ~= "class" and k ~= "CanCollide" and k ~= "Material" then p[k] = val end end
	p.CastShadow = props.CastShadow ~= false and p.Material ~= Enum.Material.Neon
	p.Parent = parent
	return p
end
local function group(name, parent) local m = Instance.new("Model"); m.Name = name; m.Parent = parent or booth; return m end
local function surface(p, face, ppS)
	local g = Instance.new("SurfaceGui"); g.Face = face or Enum.NormalId.Front
	g.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud; g.PixelsPerStud = ppS or 100
	g.LightInfluence = 0; g.Brightness = 1.4; g.ZIndexBehavior = Enum.ZIndexBehavior.Sibling; g.Parent = p
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
		local s = Instance.new("UIStroke"); s.Thickness = 3; s.Color = Color3.fromRGB(4, 10, 26); s.Parent = l
	end
	return l
end
-- "ViralRoblox NEWS" lockup used on the desk and the side panel
local function logo(parent, pos, size)
	local box = frame(parent, { Position = pos, Size = size, BackgroundTransparency = 1 })
	label(box, "ViralRoblox", { Position = UDim2.fromScale(0, 0), Size = UDim2.fromScale(1, 0.5), stroke = false })
	local badge = frame(box, { Position = UDim2.fromScale(0.18, 0.52), Size = UDim2.fromScale(0.64, 0.44), BackgroundColor3 = RED, corner = UDim.new(0.15, 0) })
	label(badge, "NEWS", { Position = UDim2.fromScale(0.05, 0.08), Size = UDim2.fromScale(0.9, 0.84), stroke = false })
	frame(box, { Position = UDim2.fromScale(0.05, 0.985), Size = UDim2.fromScale(0.9, 0.03), BackgroundColor3 = CYAN })
	return box
end

-- Room ------------------------------------------------------------------------------------------------
local room = group("Room")
part(room, "Floor", { Size = Vector3.new(44, 1, 34), Position = v(0, -0.5, -2), Color = NAVY, Reflectance = 0.12, CanCollide = true })
part(room, "Ceiling", { Size = Vector3.new(44, 1, 34), Position = v(0, 16.5, -2), Color = Color3.fromRGB(8, 14, 30) })
part(room, "WallL", { Size = Vector3.new(1, 17, 34), Position = v(-22.5, 8, -2), Color = NAVY })
part(room, "WallR", { Size = Vector3.new(1, 17, 34), Position = v(22.5, 8, -2), Color = NAVY })
part(room, "WallFront", { Size = Vector3.new(46, 17, 1), Position = v(0, 8, -19.5), Color = NAVY })
part(room, "WallBack", { Size = Vector3.new(46, 17, 1), Position = v(0, 8, 15.5), Color = NAVY })
for i, x in { -15, -5, 5, 15 } do -- lighting truss bars
	part(room, "Truss" .. i, { Size = Vector3.new(0.4, 0.4, 30), Position = v(x, 14.2, -2), Color = Color3.fromRGB(40, 44, 56), Material = Enum.Material.Metal })
end

-- Dais ------------------------------------------------------------------------------------------------
local dais = group("Dais")
local up = CFrame.Angles(0, 0, math.pi / 2)
part(dais, "Top", { Shape = Enum.PartType.Cylinder, Size = Vector3.new(DAIS_H, 9, 9), CFrame = CFrame.new(v(0, DAIS_H / 2, -1)) * up, Color = NAVY_MID, Reflectance = 0.1, CanCollide = true })
part(dais, "Ring", { Shape = Enum.PartType.Cylinder, Size = Vector3.new(DAIS_H - 0.04, 9.4, 9.4), CFrame = CFrame.new(v(0, DAIS_H / 2 - 0.01, -1)) * up, Color = CYAN, Material = Enum.Material.Neon })

-- Desk: straight centre facet with the logo, two wings angled back 35 degrees -------------------------
local desk = group("Desk")
local FRONT_Z, DEPTH, TOP = -2.2, 0.9, DAIS_H + 2.6   -- desk top just above Skye's waist
local facets = {}
do
	local a = math.rad(35)
	table.insert(facets, { name = "Centre", mid = v(0, 0, FRONT_Z), out = Vector3.new(0, 0, -1), w = 3.0 })
	for _, s in { -1, 1 } do
		local hinge = v(1.5 * s, 0, FRONT_Z)
		local dir = Vector3.new(math.cos(a) * s, 0, math.sin(a))
		local out = Vector3.new(math.sin(a) * s, 0, -math.cos(a))
		table.insert(facets, { name = s < 0 and "WingL" or "WingR", mid = hinge + dir * 0.95, out = out, w = 2.0 })
	end
end
local bodyH = TOP - DAIS_H
for _, f in facets do
	local base = Vector3.new(f.mid.X, 0, f.mid.Z)
	local function at(y, inward) local p = base + Vector3.new(0, y, 0) - f.out * inward; return CFrame.lookAt(p, p + f.out) end
	local body = part(desk, f.name, { Size = Vector3.new(f.w, bodyH, DEPTH), CFrame = at(DAIS_H + bodyH / 2, DEPTH / 2), Color = NAVY_DESK, Reflectance = 0.05, CanCollide = true })
	part(desk, f.name .. "Top", { Size = Vector3.new(f.w + 0.12, 0.12, DEPTH + 0.3), CFrame = at(TOP + 0.06, DEPTH / 2 - 0.08), Color = WHITE, Reflectance = 0.15 })
	for i, y in { DAIS_H + 0.35, TOP - 0.18 } do
		part(desk, f.name .. "Strip" .. i, { Size = Vector3.new(f.w, 0.07, 0.05), CFrame = at(y, -0.02), Color = CYAN, Material = Enum.Material.Neon })
	end
	if f.name == "Centre" then
		local g = surface(body, Enum.NormalId.Front, 120)
		logo(g, UDim2.fromScale(0.12, 0.2), UDim2.fromScale(0.76, 0.58))
	end
end
-- props on the desk top
local props = group("Props", desk)
part(props, "Mug", { Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.36, 0.3, 0.3), CFrame = CFrame.new(v(1.15, TOP + 0.3, FRONT_Z + 0.45)) * up, Color = WHITE })
part(props, "MugBand", { Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.08, 0.31, 0.31), CFrame = CFrame.new(v(1.15, TOP + 0.3, FRONT_Z + 0.45)) * up, Color = CYAN, Material = Enum.Material.Neon })
part(props, "MugHandle", { Size = Vector3.new(0.06, 0.2, 0.06), Position = v(1.34, TOP + 0.3, FRONT_Z + 0.45), Color = WHITE })
local tab = CFrame.new(v(-1.0, TOP + 0.135, FRONT_Z + 0.45)) * CFrame.Angles(0, math.rad(-15), 0)
part(props, "Tablet", { Size = Vector3.new(0.75, 0.03, 0.52), CFrame = tab, Color = Color3.fromRGB(20, 20, 24) })
part(props, "TabletScreen", { Size = Vector3.new(0.68, 0.01, 0.45), CFrame = tab * CFrame.new(0, 0.02, 0), Color = Color3.fromRGB(40, 110, 200), Material = Enum.Material.Neon })
local micBase = v(-0.55, TOP + 0.12, FRONT_Z + 0.25)
part(props, "MicBase", { Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.04, 0.22, 0.22), CFrame = CFrame.new(micBase + Vector3.new(0, 0.02, 0)) * up, Color = Color3.fromRGB(25, 25, 30), Material = Enum.Material.Metal })
part(props, "MicStand", { Size = Vector3.new(0.04, 0.55, 0.04), CFrame = CFrame.new(micBase + Vector3.new(0, 0.3, 0.05)) * CFrame.Angles(math.rad(-12), 0, 0), Color = Color3.fromRGB(25, 25, 30), Material = Enum.Material.Metal })
local flag = part(props, "MicFlag", { Size = Vector3.new(0.2, 0.2, 0.2), Position = micBase + Vector3.new(0, 0.55, 0.1), Color = NAVY_DESK })
for _, face in { Enum.NormalId.Front, Enum.NormalId.Left, Enum.NormalId.Right } do
	local g = surface(flag, face, 400)
	label(g, "VR", { Size = UDim2.fromScale(1, 0.55), Position = UDim2.fromScale(0, 0.05), stroke = false, TextColor3 = CYAN })
	label(g, "NEWS", { Size = UDim2.fromScale(1, 0.35), Position = UDim2.fromScale(0, 0.6), stroke = false })
end
part(props, "MicHead", { Shape = Enum.PartType.Ball, Size = Vector3.new(0.17, 0.17, 0.17), Position = micBase + Vector3.new(0, 0.72, 0.13), Color = Color3.fromRGB(30, 30, 34), Material = Enum.Material.Metal })

-- Video wall ------------------------------------------------------------------------------------------
local wall = group("VideoWall")
local WALL_C = v(0, 5.2, 5.5)
part(wall, "Glow", { Size = Vector3.new(10.7, 6.3, 0.15), Position = WALL_C + Vector3.new(0, 0, 0.25), Color = CYAN, Material = Enum.Material.Neon })
part(wall, "Bezel", { Size = Vector3.new(10.45, 6.05, 0.25), Position = WALL_C + Vector3.new(0, 0, 0.12), Color = Color3.fromRGB(6, 8, 14) })
local screen = part(wall, "Screen", { Size = Vector3.new(10, 5.625, 0.1), Position = WALL_C, Color = Color3.new(0, 0, 0) })
do
	local g = surface(screen, Enum.NormalId.Front, 100); g.Brightness = 1.15
	local img = frame(g, { class = "ImageLabel", Name = "Story", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), Image = STORY_IMAGE, ScaleType = Enum.ScaleType.Crop })
	local bug = frame(g, { Name = "Bug", Position = UDim2.fromScale(0.025, 0.04), Size = UDim2.fromScale(0.2, 0.1), BackgroundColor3 = RED, corner = UDim.new(0.2, 0) })
	frame(bug, { Position = UDim2.fromScale(0.07, 0.3), Size = UDim2.fromScale(0.4, 0.4), SizeConstraint = Enum.SizeConstraint.RelativeYY, BackgroundColor3 = WHITE, corner = UDim.new(0.5, 0) })
	label(bug, "LIVE", { Size = UDim2.fromScale(0.62, 0.76), Position = UDim2.fromScale(0.3, 0.12), stroke = false })
	local s = Instance.new("SurfaceLight"); s.Face = Enum.NormalId.Front; s.Color = Color3.fromRGB(120, 170, 255); s.Brightness = 0.6; s.Range = 10; s.Angle = 120; s.Parent = screen
	img.ZIndex = 1; bug.ZIndex = 2
end

-- Backdrop: block-city skyline at night ---------------------------------------------------------------
local back = part(booth, "Backdrop", { Size = Vector3.new(44, 16, 0.4), Position = v(0, 8, 9.5), Color = NAVY })
do
	local g = surface(back, Enum.NormalId.Front, 25)
	local sky = frame(g, { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(1, 1, 1) })
	local grad = Instance.new("UIGradient"); grad.Rotation = 90
	grad.Color = ColorSequence.new(Color3.fromRGB(6, 12, 30), Color3.fromRGB(28, 64, 140)); grad.Parent = sky
	local rng = Random.new(20)
	local x = 0
	while x < 1 do
		local w = rng:NextNumber(0.025, 0.06)
		local h = rng:NextNumber(0.25, 0.7)
		local b = frame(sky, { Position = UDim2.fromScale(x, 1 - h), Size = UDim2.fromScale(w, h), BackgroundColor3 = Color3.fromRGB(12, 26, 60) })
		frame(b, { Size = UDim2.new(1, 0, 0, 3), BackgroundColor3 = CYAN, BackgroundTransparency = 0.35 })
		local cols, rows = math.max(2, math.floor(w * 90)), math.floor(h * 22)
		for cx = 0, cols - 1 do
			for ry = 1, rows - 1 do
				if rng:NextNumber() < 0.42 then
					local warm = rng:NextNumber() < 0.3
					frame(b, { Position = UDim2.fromScale((cx + 0.3) / cols, ry / rows), Size = UDim2.fromScale(0.4 / cols, 0.45 / rows),
						BackgroundColor3 = warm and Color3.fromRGB(255, 210, 120) or Color3.fromRGB(110, 225, 255), BackgroundTransparency = rng:NextNumber(0.1, 0.5) })
				end
			end
		end
		x += w + rng:NextNumber(0.002, 0.012)
	end
end

-- Side panels (camera looks +Z, so world +X is screen left) -----------------------------------------------------------------------------------------
local function panel(name, x)
	local m = group(name)
	local p = v(x, 5.2, 4.2)
	local cf = CFrame.lookAt(p, v(0, 5.2, -12))
	part(m, "Glow", { Size = Vector3.new(3.6, 6.4, 0.15), CFrame = cf * CFrame.new(0, 0, 0.2), Color = CYAN, Material = Enum.Material.Neon })
	local face = part(m, "Face", { Size = Vector3.new(3.4, 6.2, 0.25), CFrame = cf, Color = NAVY_MID })
	return surface(face, Enum.NormalId.Front, 100)
end
do
	local g = panel("PanelLogo", 8.2)
	frame(g, { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(10, 22, 52) })
	logo(g, UDim2.fromScale(0.08, 0.08), UDim2.fromScale(0.84, 0.3))
	label(g, "DAILY", { Position = UDim2.fromScale(0.1, 0.5), Size = UDim2.fromScale(0.8, 0.12), TextColor3 = YELLOW })
	label(g, "ROBLOX", { Position = UDim2.fromScale(0.1, 0.63), Size = UDim2.fromScale(0.8, 0.12) })
	label(g, "NEWS", { Position = UDim2.fromScale(0.1, 0.76), Size = UDim2.fromScale(0.8, 0.12) })
end
do
	local g = panel("PanelFollow", -8.2)
	frame(g, { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(10, 22, 52) })
	local bar = frame(g, { Position = UDim2.fromScale(0, 0.08), Size = UDim2.fromScale(1, 0.14), BackgroundColor3 = RED })
	label(bar, "BREAKING", { Position = UDim2.fromScale(0.06, 0.1), Size = UDim2.fromScale(0.88, 0.8), stroke = false })
	label(g, "FOLLOW", { Position = UDim2.fromScale(0.1, 0.4), Size = UDim2.fromScale(0.8, 0.13), TextColor3 = YELLOW })
	label(g, "FOR DAILY", { Position = UDim2.fromScale(0.1, 0.55), Size = UDim2.fromScale(0.8, 0.1) })
	label(g, "ROBLOX NEWS", { Position = UDim2.fromScale(0.08, 0.66), Size = UDim2.fromScale(0.84, 0.1) })
	label(g, "@viralrobloxgames", { Position = UDim2.fromScale(0.06, 0.82), Size = UDim2.fromScale(0.88, 0.07), Font = Enum.Font.GothamBold, TextColor3 = CYAN, stroke = false })
end

-- Lights ----------------------------------------------------------------------------------------------
local lights = group("Lights")
local function lamp(name, pos, target, kind, props)
	local p = part(lights, name, { Size = Vector3.new(0.6, 0.6, 0.9), CFrame = CFrame.lookAt(pos, target), Color = Color3.fromRGB(30, 32, 40), Material = Enum.Material.Metal, CastShadow = false })
	local l = Instance.new(kind); l.Shadows = true
	for k, val in props do l[k] = val end
	if kind == "SpotLight" then l.Face = Enum.NormalId.Front end
	l.Parent = p
	return p
end
local head = v(0, DAIS_H + 4.66, 0)
lamp("Key", v(5, 13.6, -8), head, "SpotLight", { Brightness = 5, Range = 26, Angle = 40, Color = Color3.fromRGB(255, 244, 232) })
lamp("Fill", v(-5, 13.6, -8), head, "SpotLight", { Brightness = 1.6, Range = 20, Angle = 60, Color = Color3.fromRGB(220, 230, 255), Shadows = false })
lamp("RimL", v(5, 13.6, 3), head, "SpotLight", { Brightness = 6, Range = 16, Angle = 45, Color = CYAN })
lamp("RimR", v(-5, 13.6, 3), head, "SpotLight", { Brightness = 6, Range = 16, Angle = 45, Color = CYAN })
lamp("Wash", v(0, 13.5, -4), v(0, 0, 0), "PointLight", { Brightness = 0.8, Range = 22, Color = Color3.fromRGB(150, 180, 255), Shadows = false })

-- Camera marks ----------------------------------------------------------------------------------------
local cams = Instance.new("Folder"); cams.Name = "Cameras"; cams.Parent = booth
local function cam(name, pos, look)
	local p = part(cams, name, { Size = Vector3.new(0.4, 0.4, 0.6), CFrame = CFrame.lookAt(pos, look), Transparency = 1, CastShadow = false })
	p:SetAttribute("LookAt", look)
	p.Locked = true
end
cam("Wide", v(0, 5.6, -13), v(0, 4.4, 2))
cam("Medium", v(0, 5.1, -7.2), v(0, 4.5, 0))
cam("CloseUp", v(0, 5.0, -3.6), v(0, 4.85, 0))

booth.PrimaryPart = screen
booth.Parent = root

-- Stand Skye on the dais, facing the cameras
local skye = root:FindFirstChild("Skye")
if skye then
	skye:PivotTo(CFrame.lookAt(v(0, 3.5 + DAIS_H, 0), v(0, 3.5 + DAIS_H, -1)))
end
local tf = root:FindFirstChild("TestFloor"); if tf then tf:Destroy() end
return "booth built: " .. #booth:GetDescendants() .. " instances"
