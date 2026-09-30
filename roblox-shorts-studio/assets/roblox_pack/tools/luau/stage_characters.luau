--!nocheck
-- Stage the character export batch in Workspace.RobloxAssetPack._ExportStage:
--   * each character twice: "clothed" (Shirt/Pants composited by Studio) and "body" (no clothing), both without the
--     face decal (the face ships as a separate high-res layer), models renamed c01x, c02x ... (Studio names the six
--     body-part groups after the model), accessory handles renamed c01xh1x ...
--   * one standalone classic head per character (h01x ...) with a face decal, at the character's head position:
--     Studio exports it as the head mesh plus a decal overlay mesh, which becomes the "Face" object.
-- Prints the manifest as "RBXPACK|manifest_characters|i|n|json" for tools/pull_studio_log.py.
local HttpService = game:GetService("HttpService")
local root = workspace.RobloxAssetPack
local stage = root:FindFirstChild("_ExportStage"); if stage then stage:Destroy() end
stage = Instance.new("Folder"); stage.Name = "_ExportStage"; stage.Parent = root
local function r(x) return math.floor(x * 1e5 + 0.5) / 1e5 end
local function cf(c) local t = { c:GetComponents() }; for i, v in ipairs(t) do t[i] = r(v) end; return t end
local function rgb(c) return { math.floor(c.R * 255 + 0.5), math.floor(c.G * 255 + 0.5), math.floor(c.B * 255 + 0.5) } end
local function emit(key, str)
	local n = math.ceil(#str / 800)
	for i = 1, n do print(string.format("RBXPACK|%s|%d|%d|%s", key, i, n, str:sub((i - 1) * 800 + 1, i * 800))) end
end
local BODY = { "Head", "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg" }
local manifest = { batch = "characters", items = {} }
local n = 0
for ci, char in ipairs(root.Characters:GetChildren()) do
	local origin = CFrame.new(char.HumanoidRootPart.Position.X, 0, char.HumanoidRootPart.Position.Z)
	for _, variant in ipairs({ "clothed", "body" }) do
		if variant == "body" and not char:FindFirstChildOfClass("Shirt") then continue end
		n += 1
		local tag = string.format("c%02dx", n)
		local c = char:Clone()
		c.Name = tag
		local face = c.Head:FindFirstChild("face"); if face then face:Destroy() end
		if variant == "body" then for _, k in ipairs(c:GetChildren()) do if k:IsA("Clothing") then k:Destroy() end end end
		local item = { item = char.Name, variant = variant, tag = tag, kind = "character", pivot = cf(origin), headTag = string.format("h%02dx", ci), parts = {}, accessories = {} }
		for _, bn in ipairs(BODY) do
			local p = c[bn]
			table.insert(item.parts, { tag = tag, name = bn, class = p.ClassName, size = { p.Size.X, p.Size.Y, p.Size.Z }, cframe = cf(p.CFrame), color = rgb(p.Color), material = p.Material.Name })
		end
		local a = 0
		for _, acc in ipairs(c:GetChildren()) do
			if acc:IsA("Accessory") then
				a += 1
				local h = acc.Handle
				local htag = string.format("%sh%dx", tag, a)
				table.insert(item.accessories, { tag = htag, name = acc.Name, class = h.ClassName, size = { h.Size.X, h.Size.Y, h.Size.Z }, cframe = cf(h.CFrame),
					color = rgb(h.Color), material = h.Material.Name, texturedMesh = h:IsA("MeshPart") and h.TextureID ~= "", sourceAssetId = acc:GetAttribute("SourceAssetId"),
					attachment = h:FindFirstChildOfClass("Attachment").Name })
				h.Name = htag
			end
		end
		c.Parent = stage
		table.insert(manifest.items, item)
	end
	local htag = string.format("h%02dx", ci)
	local head = Instance.new("Part"); head.Name = htag; head.Size = Vector3.new(2, 1, 1); head.Anchored = true
	head.Color = char.Head.Color; head.TopSurface = Enum.SurfaceType.Smooth; head.BottomSurface = Enum.SurfaceType.Smooth
	local sm = Instance.new("SpecialMesh"); sm.MeshType = Enum.MeshType.Head; sm.Scale = Vector3.new(1.25, 1.25, 1.25); sm.Parent = head
	local d = Instance.new("Decal"); d.Name = "face"; d.Face = Enum.NormalId.Front; d.Texture = "rbxasset://textures/face.png"; d.Parent = head
	head.CFrame = char.Head.CFrame
	head.Parent = stage
	table.insert(manifest.items, { item = char.Name, variant = "head", tag = htag, kind = "head", pivot = cf(origin),
		parts = { { tag = htag, name = "Head", class = "Part", size = { 2, 1, 1 }, cframe = cf(head.CFrame), color = rgb(head.Color), material = "Plastic" } } })
end
emit("manifest_characters", HttpService:JSONEncode(manifest))
return "staged " .. #manifest.items .. " character items"
