"""Generate the native installer and augment the portable Studio file (no network)."""
import json, xml.etree.ElementTree as ET
from pathlib import Path
P=Path(__file__).resolve().parents[1]
d=json.loads((P/'horror/manifest.json').read_text())
d['rig']=json.loads((P/'characters/Unlisted/rig.json').read_text())
d['animations']=[json.loads((P/'animations'/f'{n}.json').read_text()) for n in d['motions']]
d['runtime']=(P/'studio/HorrorControls.luau').read_text()
d['ui']=[
 ('ServerOne','PLAYERS ONLINE: 1\nYOU'),('ServerTwo','PLAYERS ONLINE: 2\nYOU\n[ NAME UNAVAILABLE ]'),
 ('JoinLeave','[ NAME UNAVAILABLE ] JOINED'),('ConnectionWarning','CONNECTION LOST\nYOU ARE STILL IN THE SERVER\nAFTER HOURS / FICTIONAL STORY UI'),
 ('Rule01','RULE 1\nCheck the camera before serving.'),('Rule02','RULE 2\nCount the customers twice.'),('Rule03','RULE 3\nClose the shutter at 03:00.'),
 ('CCTV','CAM 01 / 02:59:58\nSTORY CAMERA'),('DelayedFeed','CAM 01 / DELAYED FEED'),('Fuel','KEEP THE FIRE LIT\nFUEL: 80%'),
 ('Receipt','AFTER HOURS\nORDER 014\nONE DRINK\nCUSTOMERS: 1'),('Cover','AFTER HOURS / 01\nTHE SERVER WAS EMPTY.\nSo who copied my wave?')]
# JSON is embedded using a levelled long string, so quotes/newlines cannot execute code.
code=r'''local data=game:GetService('HttpService'):JSONDecode([====[PAYLOAD]====])
local pack=assert(workspace:FindFirstChild('RobloxAssetPack'),'RobloxAssetPack is missing')
local old=pack:FindFirstChild('Horror')
assert(not old or old:GetAttribute('Builder')=='AfterHours_v1','Unowned Horror folder exists; preserved')
local change=game:GetService('ChangeHistoryService')
pcall(function() change:SetWaypoint('Before After Hours asset kit') end)
local root=Instance.new('Folder');root.Name='Horror';root:SetAttribute('Builder','AfterHours_v1')
local groups={}
for _,n in {'Characters','Map','Props','Animations','UI','Lighting','Audio'} do
 local f=Instance.new('Folder');f.Name=n;f.Parent=root;groups[n]=f
end
local function stringValue(parent,name,value)
 local v=Instance.new('StringValue');v.Name=name;v.Value=value;v.Parent=parent;return v
end
local function cf(v) return CFrame.new(table.unpack(v)) end
-- Position the display grid beyond the existing pack. Rebuilding retains the same origin.
local start=old and old:GetAttribute('DisplayOrigin')
if not start then
 local maxX,minY,maxZ=-math.huge,math.huge,-math.huge
 for _,p in pack:GetDescendants() do
  if p:IsA('BasePart') then maxX=math.max(maxX,p.Position.X+p.Size.Magnitude/2);minY=math.min(minY,p.Position.Y-p.Size.Y/2);maxZ=math.max(maxZ,p.Position.Z) end
 end
 start=Vector3.new(maxX==-math.huge and 0 or maxX+35,math.abs(minY)==math.huge and 0 or minY,maxZ==-math.huge and 0 or maxZ)
end
root:SetAttribute('DisplayOrigin',start)
local function label(part,text)
 local gui=Instance.new('SurfaceGui');gui.Name='Label';gui.Face=Enum.NormalId.Front;gui.SizingMode=Enum.SurfaceGuiSizingMode.PixelsPerStud;gui.PixelsPerStud=70;gui.Parent=part
 local t=Instance.new('TextLabel');t.Name='Text';t.Size=UDim2.fromScale(1,1);t.BackgroundTransparency=1;t.Font=Enum.Font.Code;t.TextScaled=true;t.Text=text
 t.TextColor3=part.Color.R>.7 and Color3.fromRGB(18,30,38) or Color3.fromRGB(232,244,237);t.Parent=gui
end
local count=0
for i,m in data.models do
 local model=Instance.new('Model');model.Name=m.name
 model.Parent=groups[m.kind=='characters' and 'Characters' or m.kind=='map' and 'Map' or 'Props']
 local offset=start+Vector3.new(((i-1)%6)*32,0,math.floor((i-1)/6)*38)
 local refs={}
 local origin=Instance.new('Part');origin.Name='AssetOrigin';origin.Size=Vector3.new(.1,.1,.1);origin.CFrame=CFrame.new(offset);origin.Transparency=1;origin.Anchored=true;origin.CanCollide=false;origin.CanQuery=false;origin.Parent=model;model.PrimaryPart=origin
 for _,p in m.parts do
  local part=Instance.new('Part');part.Name=p.name;part.Size=Vector3.new(table.unpack(p.size));part.Color=Color3.fromHex(p.color)
  local r=p.rot;local rotation=CFrame.Angles(0,0,math.rad(r[3]))*CFrame.Angles(0,math.rad(r[2]),0)*CFrame.Angles(math.rad(r[1]),0,0)
  if p.shape=='cylinder' then part.Shape=Enum.PartType.Cylinder;part.Size=Vector3.new(p.size[2],p.size[1],p.size[3]);rotation=rotation*CFrame.Angles(0,0,math.pi/2)
  elseif p.shape=='sphere' then part.Shape=Enum.PartType.Ball end
  part.CFrame=CFrame.new(offset+Vector3.new(table.unpack(p.pos)))*rotation
  part.Anchored=not m.rig;part.CanCollide=false;part.Massless=true;part.TopSurface=Enum.SurfaceType.Smooth;part.BottomSurface=Enum.SurfaceType.Smooth
  part.Material=p.neon and Enum.Material.Neon or Enum.Material.SmoothPlastic;part.Parent=model;refs[p.name]=part
  stringValue(part,'HorrorGroup',p.group)
  if p.label then label(part,p.label) end
  count+=1
 end
 if m.rig then
  -- Cylinder orientation differs from R6 head frame: keep a block head carrier and weld the visible cylinder.
  local visual=refs.Head;visual.Name='HeadVisual'
  local head=Instance.new('Part');head.Name='Head';head.Size=Vector3.new(2,1,1);head.CFrame=CFrame.new(offset+Vector3.new(0,4.5,0));head.Transparency=1;head.Massless=true;head.CanCollide=false;head.Parent=model;refs.Head=head
  local weld=Instance.new('WeldConstraint');weld.Part0=head;weld.Part1=visual;weld.Parent=visual
  local hrp=Instance.new('Part');hrp.Name='HumanoidRootPart';hrp.Size=Vector3.new(2,2,1);hrp.CFrame=CFrame.new(offset+Vector3.new(0,3,0));hrp.Transparency=1;hrp.Anchored=true;hrp.CanCollide=false;hrp.Parent=model;refs.HumanoidRootPart=hrp;model.PrimaryPart=hrp
  local hu=Instance.new('Humanoid');hu.DisplayDistanceType=Enum.HumanoidDisplayDistanceType.None;hu.Parent=model;Instance.new('Animator',hu)
  for _,j in data.rig.joints do local joint=Instance.new('Motor6D');joint.Name=j.name;joint.Part0=refs[j.part0];joint.Part1=refs[j.part1];joint.C0=cf(j.c0);joint.C1=cf(j.c1);joint.Parent=refs[j.part0] end
  for _,p in m.parts do
   if p.group~=p.name or p.name=='Face' then local w=Instance.new('WeldConstraint');w.Part0=refs[p.name=='Face' and 'Head' or p.group];w.Part1=refs[p.name];w.Parent=refs[p.name] end
  end
  for _,x in {-.23,.23} do local eye=Instance.new('Part');eye.Name='RevealEye';eye.Size=Vector3.new(.06,.22,.02);eye.CFrame=CFrame.new(offset+Vector3.new(x,4.5,-.674));eye.Color=Color3.fromRGB(105,228,223);eye.Material=Enum.Material.Neon;eye.Transparency=1;eye.CanCollide=false;eye.Massless=true;eye.Parent=model;local w=Instance.new('WeldConstraint');w.Part0=head;w.Part1=eye;w.Parent=eye end
 end
 stringValue(model,'HorrorMetadata',game:GetService('HttpService'):JSONEncode({name=m.name,description=m.description,controls=m.controls or {}}))
 model:SetAttribute('AssetKind',m.kind);model:SetAttribute('OriginalAsset',true)
end
for _,a in data.animations do
 local seq=Instance.new('KeyframeSequence');seq.Name=a.name;seq.Loop=a.loop;seq.Priority=Enum.AnimationPriority.Action;seq.Parent=groups.Animations
 for _,k in a.keyframes do
  local key=Instance.new('Keyframe');key.Time=k.time;key.Parent=seq
  local base=Instance.new('Pose');base.Name='HumanoidRootPart';base.Weight=0;base.Parent=key
  local torso
  for _,j in {'RootJoint','Neck','Right Shoulder','Left Shoulder','Right Hip','Left Hip'} do local v=k.poses[j];local pose=Instance.new('Pose');pose.Name=v.part;pose.CFrame=cf(v.cframe);pose.Weight=1;pose.EasingStyle=Enum.PoseEasingStyle.Cubic;pose.EasingDirection=Enum.PoseEasingDirection.InOut;pose.Parent=j=='RootJoint' and base or torso;if j=='RootJoint' then torso=pose end end
 end
end
for _,row in data.ui do
 local gui=Instance.new('ScreenGui');gui.Name=row[1];gui.Enabled=false;gui.IgnoreGuiInset=true;gui.ResetOnSpawn=false;gui.Parent=groups.UI
 local frame=Instance.new('Frame');frame.Name='Panel';frame.Position=UDim2.fromScale(.07,.17);frame.Size=UDim2.fromScale(.82,.2);frame.BackgroundColor3=Color3.fromRGB(17,33,43);frame.BackgroundTransparency=.08;frame.Parent=gui
 local stroke=Instance.new('UIStroke');stroke.Color=Color3.fromRGB(120,228,216);stroke.Thickness=2;stroke.Parent=frame
 local text=Instance.new('TextLabel');text.Name='Content';text.Position=UDim2.fromScale(.04,.04);text.Size=UDim2.fromScale(.92,.92);text.BackgroundTransparency=1;text.TextColor3=Color3.fromRGB(232,244,237);text.Font=Enum.Font.Code;text.TextScaled=true;text.Text=row[2];text.Parent=frame
end
for _,name in {'Normal','Warning','Emergency','Forest','Daylight'} do
 local cfg=Instance.new('Configuration');cfg.Name=name;cfg:SetAttribute('ClockTime',name=='Daylight' and 14 or 1);cfg:SetAttribute('Brightness',name=='Daylight' and 2.5 or 2);cfg:SetAttribute('Ambient',Color3.fromRGB(95,116,133));cfg:SetAttribute('OutdoorAmbient',Color3.fromRGB(66,91,105));cfg:SetAttribute('ExposureCompensation',.15);cfg:SetAttribute('PracticalColor',name=='Emergency' and Color3.fromRGB(255,121,106) or Color3.fromRGB(255,206,140));cfg.Parent=groups.Lighting
end
for _,s in data.audio do stringValue(groups.Audio,s.name,s.path..' | original local WAV; upload to Roblox and set your own SoundId if Studio playback is needed') end
local mod=Instance.new('ModuleScript');mod.Name='HorrorControls';mod.Source=data.runtime;mod.Parent=root
stringValue(root,'README','Original After Hours production kit. Clone assets to stage scenes. UI templates disabled. Audio is local WAV; no uploaded SoundIds. Controls are opt-in. No gameplay or global Lighting changed. Source: assets/roblox_pack/tools/build_horror.py')
assert(#groups.Characters:GetChildren()==2 and #groups.Animations:GetChildren()==12,'Build failed validation')
if old then old:Destroy() end
root.Parent=pack
pcall(function() change:SetWaypoint('Added After Hours asset kit') end)
game:GetService('Selection'):Set({root})
return game:GetService('HttpService'):JSONEncode({folder=root:GetFullName(),models=#data.models,parts=count,motions=#data.animations,ui=#data.ui,origin={start.X,start.Y,start.Z},note='Edit session only; not published'})
'''.replace('PAYLOAD',json.dumps(d,separators=(',',':')))
(P/'studio/install_horror.luau').write_text(code,encoding='utf-8')
# Portable file gets controls and documentation; regenerate geometry before rerunning this augmentation.
tree=ET.parse(P/'studio/AfterHours_HorrorPack.rbxmx');root=tree.getroot().find('Item')
for cls,name,prop,typ,value in [('ModuleScript','HorrorControls','Source','ProtectedString',d['runtime']),('StringValue','README','Value','string','Original After Hours kit. See horror/README.md; audio is local, not uploaded.')]:
 it=ET.SubElement(root,'Item',{'class':cls,'referent':'HORROR_'+name});props=ET.SubElement(it,'Properties');ET.SubElement(props,'string',name='Name').text=name;ET.SubElement(props,typ,name=prop).text=value
ET.indent(tree);tree.write(P/'studio/AfterHours_HorrorPack.rbxmx',encoding='utf-8',xml_declaration=True)
print('Generated Studio installer with 30 models, 12 motions, 12 UI templates, 5 presets; preserved local WAV references.')
