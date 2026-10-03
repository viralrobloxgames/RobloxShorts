--!nocheck
-- Stage rigged creatures / eggs for an OBJ export: clone each source model into Workspace._ShortsStage.Export,
-- turn it to face -Z (head minus tail, snapped to a quarter turn), stand it on the stage floor, rename every visible
-- part to a unique tag (i<item>p<part>x) and print a manifest ("RBXPACK|manifest_<batch>|i|n|json") for
-- tools/pull_studio_log.py. The manifest carries what tools/build_creatures.py needs for the OBJ split and rig.json:
-- parts (with the rigid BODY each is welded into), Motor6D joints, Bones, Animations and KeyframeSequences.
-- Run through the Studio MCP (execute_luau, Edit).

-- Installed as a ModuleScript (Workspace._ShortsStage.StageCreatures) and called per batch:
--   require(module)(BATCH, ITEMS, EXPORT)
--   ITEMS = { { source = Instance, item = "pack_name", category = "creatures" | "props" | "eggs", yaw = radians? }, ... }
return function(BATCH, ITEMS, EXPORT, ORIGIN, SPACING)
ORIGIN = ORIGIN or Vector3.new(0, 2000, 5200)
SPACING = SPACING or 60

local HttpService = game:GetService("HttpService")
local stageRoot = workspace:FindFirstChild("_ShortsStage") or Instance.new("Folder")
stageRoot.Name = "_ShortsStage"; stageRoot.Archivable = false; stageRoot.Parent = workspace
local stage = stageRoot:FindFirstChild("Export"); if stage then stage:Destroy() end
stage = Instance.new("Folder"); stage.Name = "Export"; stage.Parent = stageRoot

local function r(x) return math.floor(x * 1e4 + 0.5) / 1e4 end
local function cf(c) local t = { c:GetComponents() }; for i, v in ipairs(t) do t[i] = r(v) end; return t end
local function rgb(c) return { math.floor(c.R * 255 + 0.5), math.floor(c.G * 255 + 0.5), math.floor(c.B * 255 + 0.5) } end
local function emit(key, str)
	local n = math.ceil(#str / 800)
	for i = 1, n do print(string.format("RBXPACK|%s|%d|%d|%s", key, i, n, str:sub((i - 1) * 800 + 1, i * 800))) end
end

local function forward(model)
	local hs, ts, hn, tn = Vector3.zero, Vector3.zero, 0, 0
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") then
			local n = string.lower(d.Name)
			if string.find(n, "head") then hs += d.Position; hn += 1 end
			if string.find(n, "tail") then ts += d.Position; tn += 1 end
		end
	end
	if hn == 0 or tn == 0 then return nil end
	local v = hs / hn - ts / tn
	v = Vector3.new(v.X, 0, v.Z)
	if v.Magnitude < 1e-3 then return nil end
	return v.Unit
end

local function aabb(model)
	local lo, hi = Vector3.one * math.huge, -Vector3.one * math.huge
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") and d.Transparency < 1 then
			local h = d.Size / 2
			for sx = -1, 1, 2 do for sy = -1, 1, 2 do for sz = -1, 1, 2 do
				local p = d.CFrame:PointToWorldSpace(Vector3.new(h.X * sx, h.Y * sy, h.Z * sz))
				lo, hi = lo:Min(p), hi:Max(p)
			end end end
		end
	end
	return lo, hi
end

local manifest = { batch = BATCH, items = {} }
local nParts = 0
for idx, cfg in ipairs(ITEMS) do
	local src = cfg.source
	local clone = src:Clone()
	local animations, sequences = {}, {}
	for _, d in ipairs(clone:GetDescendants()) do
		if d:IsA("Animation") then table.insert(animations, { name = d.Name, id = d.AnimationId })
		elseif d:IsA("KeyframeSequence") then table.insert(sequences, d.Name)
		elseif d:IsA("LuaSourceContainer") then d:Destroy() end
	end
	for _, d in ipairs(clone:GetDescendants()) do
		if d:IsA("BasePart") then d.Anchored = true end
	end
	clone.Parent = stage
	-- face -Z, stand on the floor
	local f = forward(clone)
	local yaw = 0
	if f then yaw = math.round(math.atan2(-f.X, -f.Z) / (math.pi / 2)) * (math.pi / 2) end
	if cfg.yaw then yaw = cfg.yaw end
	clone:PivotTo(CFrame.Angles(0, -yaw, 0) * clone:GetPivot())
	local lo, hi = aabb(clone)
	local col, row = (idx - 1) % 8, math.floor((idx - 1) / 8)
	local target = ORIGIN + Vector3.new((col - 3.5) * SPACING, 0, row * SPACING)
	clone:PivotTo(clone:GetPivot() + (target - Vector3.new((lo.X + hi.X) / 2, lo.Y, (lo.Z + hi.Z) / 2)))
	lo, hi = aabb(clone)

	-- rigid bodies: parts joined by anything that is not a Motor6D move as one
	local parent = {}
	local function find(p) while parent[p] and parent[p] ~= p do p = parent[p] end; return p end
	local function union(a, b) if a and b then local ra, rb = find(a), find(b); if ra ~= rb then parent[ra] = rb end end end
	local parts, motors, driven = {}, {}, {}
	for _, d in ipairs(clone:GetDescendants()) do
		if d:IsA("BasePart") then parent[d] = parent[d] or d; table.insert(parts, d)
		elseif d:IsA("Motor6D") then table.insert(motors, d); if d.Part1 then driven[d.Part1] = d end
		elseif d:IsA("WeldConstraint") or d:IsA("JointInstance") then
			if d.Part0 and d.Part1 and d.Part0:IsDescendantOf(clone) and d.Part1:IsDescendantOf(clone) then
				parent[d.Part0] = parent[d.Part0] or d.Part0; parent[d.Part1] = parent[d.Part1] or d.Part1
				union(d.Part0, d.Part1)
			end
		end
	end
	local rootPart
	for _, m in ipairs(motors) do if m.Part0 and not driven[m.Part0] then rootPart = m.Part0 break end end
	rootPart = rootPart or clone.PrimaryPart
	-- body name per weld group: the Motor6D-driven part in it, else the root, else its biggest part
	local bodyOf, bodyPart, used = {}, {}, {}
	local function nameBody(group, part)
		if bodyOf[group] then return end
		local base, n, k = part.Name, part.Name, 2
		while used[n] do n = base .. "_" .. k; k += 1 end
		used[n] = true; bodyOf[group] = n; bodyPart[group] = part
	end
	if rootPart then nameBody(find(rootPart), rootPart) end
	for _, m in ipairs(motors) do if m.Part1 then nameBody(find(m.Part1), m.Part1) end end
	local loose = {}
	for _, p in ipairs(parts) do
		local g = find(p)
		if not bodyOf[g] then
			local best = loose[g]
			if not best or p.Size.X * p.Size.Y * p.Size.Z > best.Size.X * best.Size.Y * best.Size.Z then loose[g] = p end
		end
	end
	local nLoose = 0
	for g, p in pairs(loose) do nLoose += 1 end
	-- a model with no joints at all (an egg, a static prop) is one body
	local single = #motors == 0
	for g, p in pairs(loose) do if not single then nameBody(g, p) end end

	local item = { item = cfg.item, category = cfg.category, folder = cfg.category .. "/" .. cfg.item, sourceName = src.Name, sourcePath = src:GetFullName(),
		pivot = cf(CFrame.new((lo.X + hi.X) / 2, lo.Y, (lo.Z + hi.Z) / 2)), pivotKind = "bottom_centre", size = { r(hi.X - lo.X), r(hi.Y - lo.Y), r(hi.Z - lo.Z) },
		faceYaw = r(yaw), facingKnown = f ~= nil, root = rootPart and bodyOf[find(rootPart)] or nil, single = single,
		parts = {}, bodies = {}, joints = {}, bones = {}, animations = animations, keyframeSequences = sequences, attachments = {} }
	if not single then
		for g, name in pairs(bodyOf) do
			local p = bodyPart[g]
			table.insert(item.bodies, { name = name, part = p.Name, cframe = cf(p.CFrame), loose = loose[g] ~= nil or nil })
		end
		table.sort(item.bodies, function(a, b) return a.name < b.name end)
	end
	for _, m in ipairs(motors) do
		if m.Part0 and m.Part1 then
			table.insert(item.joints, { name = m.Name, part0 = bodyOf[find(m.Part0)], part1 = bodyOf[find(m.Part1)], c0 = cf(m.C0), c1 = cf(m.C1), world = cf(m.Part1.CFrame * m.C1) })
		end
	end
	for _, d in ipairs(clone:GetDescendants()) do
		if d:IsA("Bone") then
			table.insert(item.bones, { name = d.Name, parent = d.Parent.Name, parentIsBone = d.Parent:IsA("Bone"), cframe = cf(d.CFrame), world = cf(d.WorldCFrame) })
		elseif d:IsA("Attachment") and d.Parent:IsA("BasePart") then
			table.insert(item.attachments, { name = d.Name, body = single and cfg.item or bodyOf[find(d.Parent)], world = cf(d.WorldCFrame) })
		end
	end
	local k = 0
	for _, d in ipairs(parts) do
		if d.Transparency < 1 then
			k += 1
			local tag = string.format("i%03dp%03dx", idx, k)
			local t = { tag = tag, name = d.Name, class = d.ClassName, body = single and cfg.item or bodyOf[find(d)], size = { r(d.Size.X), r(d.Size.Y), r(d.Size.Z) }, cframe = cf(d.CFrame),
				color = rgb(d.Color), material = d.Material.Name, transparency = r(d.Transparency), reflectance = r(d.Reflectance) }
			if d:IsA("Part") then t.shape = d.Shape.Name end
			if d:IsA("MeshPart") then t.meshId = d.MeshId; t.textureId = d.TextureID end
			local sm = d:FindFirstChildOfClass("SpecialMesh")
			if sm then t.specialMesh = { meshType = sm.MeshType.Name, meshId = sm.MeshId, textureId = sm.TextureId, scale = { r(sm.Scale.X), r(sm.Scale.Y), r(sm.Scale.Z) } } end
			local sa = d:FindFirstChildOfClass("SurfaceAppearance")
			if sa then t.surfaceAppearance = { colorMap = sa.ColorMap, normalMap = sa.NormalMap } end
			for _, c in ipairs(d:GetChildren()) do
				if c:IsA("Decal") then
					t.decals = t.decals or {}
					table.insert(t.decals, { name = c.Name, face = c.Face.Name, texture = c.Texture })
				end
			end
			table.insert(item.parts, t)
			d.Name = tag
			nParts += 1
		end
	end
	table.insert(manifest.items, item)
end
emit("manifest_" .. BATCH, HttpService:JSONEncode(manifest))
local lo, hi = aabb(stage)
workspace.CurrentCamera.CFrame = CFrame.lookAt(Vector3.new((lo.X + hi.X) / 2, hi.Y + 30, lo.Z - 60 - (hi.X - lo.X) * 0.45), (lo + hi) / 2)
if EXPORT then
	game:GetService("Selection"):Set({ stage })
	PluginManager():ExportSelection("")
end
return string.format("staged %d items (%d parts) for batch %s", #manifest.items, nParts, BATCH)
end
