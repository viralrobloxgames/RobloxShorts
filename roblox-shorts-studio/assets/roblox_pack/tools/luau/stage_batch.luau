--!nocheck
-- Stage one export batch: clone every item of a source folder into Workspace.RobloxAssetPack._ExportStage,
-- rename each part to a unique tag (i<item>p<part>x) so Studio's OBJ groups can be split back into items,
-- and print a manifest (chunked, "RBXPACK|manifest_<batch>|i|n|json") for tools/pull_studio_log.py.
-- Run through the Studio MCP (execute_luau, Edit). Edit the CONFIG block per batch.

-- CONFIG --------------------------------------------------------------------------------------------
local BATCH = "props"                      -- props | accessories | map_a | map_b ...
local SOURCE = { "Props" }                 -- child folders of Workspace.RobloxAssetPack
local CATEGORY = "props"                   -- output folder in the pack
local ONLY = nil                           -- optional { itemName = true, ... }
local EXPORT = true                        -- select the stage and open Studio's Export Selection dialog
                                           -- (tools/save_export_dialog.ps1 fills it in and clicks Save)
-------------------------------------------------------------------------------------------------------

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

local function partInfo(p, tag)
	local t = { tag = tag, name = p.Name, class = p.ClassName, size = { r(p.Size.X), r(p.Size.Y), r(p.Size.Z) }, cframe = cf(p.CFrame),
		color = rgb(p.Color), material = p.Material.Name, transparency = p.Transparency, reflectance = p.Reflectance, overlays = {} }
	if p:IsA("Part") then t.shape = p.Shape.Name end
	if p:IsA("BasePart") and not p:IsA("TrussPart") then
		local ok = pcall(function()
			t.surfaces = { Top = p.TopSurface.Name, Bottom = p.BottomSurface.Name, Front = p.FrontSurface.Name, Back = p.BackSurface.Name, Left = p.LeftSurface.Name, Right = p.RightSurface.Name }
		end)
	end
	if p:IsA("MeshPart") then t.meshId = p.MeshId; t.textureId = p.TextureID; t.texturedMesh = p.TextureID ~= "" end
	local sm = p:FindFirstChildOfClass("SpecialMesh")
	if sm then
		t.specialMesh = { meshType = sm.MeshType.Name, scale = { sm.Scale.X, sm.Scale.Y, sm.Scale.Z }, meshId = sm.MeshId, textureId = sm.TextureId }
		if sm.MeshType == Enum.MeshType.FileMesh and sm.TextureId ~= "" then t.texturedMesh = true end
	end
	for _, c in ipairs(p:GetChildren()) do
		if c:IsA("Decal") then   -- Texture inherits from Decal
			local o = { class = c.ClassName, name = c.Name, face = c.Face.Name, texture = c.Texture, color = rgb(c.Color3), transparency = c.Transparency }
			if c:IsA("Texture") then o.studsPerTileU = c.StudsPerTileU; o.studsPerTileV = c.StudsPerTileV end
			table.insert(t.overlays, o)
		end
	end
	return t
end

local manifest = { batch = BATCH, category = CATEGORY, items = {} }
local idx = 0
for _, folderName in ipairs(SOURCE) do
	for _, src in ipairs(root[folderName]:GetChildren()) do
		if ONLY and not ONLY[src.Name] then continue end
		idx += 1
		local clone = src:Clone()
		-- pivot: Tool -> its (invisible) grip Handle; Model -> WorldPivot
		local pivot
		if clone:IsA("Tool") then pivot = clone.Handle.CFrame else pivot = clone.WorldPivot end
		local item = { item = src.Name, category = CATEGORY, folder = CATEGORY .. "/" .. src.Name, file = src.Name, kind = src:GetAttribute("PackKind") or CATEGORY,
			pivot = cf(pivot), pivotKind = src:GetAttribute("PivotKind") or (clone:IsA("Tool") and "grip") or (src:GetAttribute("Attachment")) or "bottom_centre",
			attachment = src:GetAttribute("Attachment"), attachTo = src:GetAttribute("AttachTo"), sourceAssetId = src:GetAttribute("SourceAssetId"),
			toolGrip = clone:IsA("Tool") and cf(clone.Grip) or nil, parts = {} }
		for _, d in ipairs(clone:GetDescendants()) do
			if d:IsA("BasePart") and (d:GetAttribute("ExportSkip") or d.Transparency >= 1) then d:Destroy() end
		end
		local k = 0
		for _, d in ipairs(clone:GetDescendants()) do
			if d:IsA("BasePart") then
				k += 1
				local tag = string.format("i%02dp%03dx", idx, k)
				table.insert(item.parts, partInfo(d, tag))
				d.Name = tag
			end
		end
		clone.Parent = stage
		table.insert(manifest.items, item)
	end
end
emit("manifest_" .. BATCH, HttpService:JSONEncode(manifest))
local nParts = 0
for _, it in ipairs(manifest.items) do nParts += #it.parts end
if EXPORT then
	game:GetService("Selection"):Set({ stage })
	PluginManager():ExportSelection("")      -- modal: blocks this thread until the dialog closes
end
return string.format("staged %d items (%d parts) for batch %s", #manifest.items, nParts, BATCH)
