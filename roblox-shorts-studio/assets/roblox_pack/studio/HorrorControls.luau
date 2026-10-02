-- Original After Hours helpers. Requiring this module has no global side effects.
-- Works on clones. SetControl values 0..1; fire uses high/low/out.
local HttpService = game:GetService('HttpService')
local M = {}
local cache = setmetatable({}, {__mode='k'})
function M.SetControl(model, controlName, value)
    local meta = HttpService:JSONDecode(model.HorrorMetadata.Value)
    local c = assert(meta.controls[controlName], 'Unknown horror control')
    local stored = cache[model]
    if not stored then
        stored={origin=model:GetPivot(),parts={}}
        for _,p in model:GetDescendants() do
            if p:IsA('BasePart') then stored.parts[p]={cf=model:GetPivot():ToObjectSpace(p.CFrame),size=p.Size,transparency=p.Transparency} end
        end
        cache[model]=stored
    end
    local pivot=model:GetPivot()
    -- AssetOrigin survives Model:PivotTo and supplies the documented feet/hinge coordinate frame.
    local originPart=model:FindFirstChild('AssetOrigin')
    local origin=originPart and originPart.CFrame or pivot
    local angle=c.range and (c.range[1]+(c.range[2]-c.range[1])*math.clamp(value,0,1)) or 0
    for p,rest in stored.parts do
        local tag=p:FindFirstChild('HorrorGroup')
        if tag and table.find(c.groups,tag.Value) then
            local base=pivot*rest.cf
            if c.states then
                p.Transparency=value=='out' and 1 or rest.transparency
                local s=value=='low' and .43 or 1
                local localCF=origin:ToObjectSpace(base)
                p.Size=rest.size*s
                p.CFrame=origin*CFrame.new(localCF.Position*s)*localCF.Rotation
            elseif c.pivot then
                local h=origin*CFrame.new(table.unpack(c.pivot))
                p.CFrame=h*CFrame.Angles(0,math.rad(angle),0)*h:Inverse()*base
            else
                p.CFrame=base+origin:VectorToWorldSpace(Vector3.new(0,angle,0))
            end
        end
    end
end
function M.SetRevealed(model,revealed)
    for _,p in model:GetDescendants() do
        if p.Name=='RevealEye' then p.Transparency=revealed and 0 or 1 end
    end
end
function M.SetStatue(model)
    for _,p in model:GetDescendants() do
        if p:IsA('BasePart') and p.Transparency<1 then p.Color=Color3.fromRGB(132,146,146);p.Material=Enum.Material.Slate end
    end
end
function M.SetPanel(model,partName,text)
    local part=assert(model:FindFirstChild(partName,true),'Missing panel')
    part.Label.Text.Text=text
end
function M.AttachProp(character,prop,hand)
    local arm=character[hand=='left' and 'Left Arm' or 'Right Arm']
    local grip=arm.CFrame*CFrame.new(0,-1,0)
    prop:PivotTo(grip)
    for _,p in prop:GetDescendants() do
        if p:IsA('BasePart') then p.Anchored=false;p.CanCollide=false;p.Massless=true
            local w=Instance.new('WeldConstraint');w.Part0=arm;w.Part1=p;w.Parent=p
        end
    end
end
return M
