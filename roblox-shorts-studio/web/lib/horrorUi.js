// Portrait story graphics. Logical canvas 1080x1920; pass renderer scale.
const ink='#e8f4ed',cyan='#78e4d8',dark='#11212beF';
function panel(g,x,y,w,h){g.fillStyle=dark;g.fillRect(x,y,w,h);g.fillStyle=cyan;g.fillRect(x,y,7,h);}
function text(g,s,x,y,size=34,color=ink){g.font=`800 ${size}px Montserrat, sans-serif`;g.fillStyle=color;g.fillText(s,x,y);}
function draw(g,scale,fn){g.save();g.scale(scale,scale);fn();g.restore();}
export function serverPanel(g,scale,{players=1,names=['YOU'],missing=false,message=''}={}){draw(g,scale,()=>{
  panel(g,74,290,620,125+names.length*46);text(g,`PLAYERS ONLINE: ${players}`,100,339,30);
  names.forEach((n,i)=>text(g,missing&&i===names.length-1?'[ NAME UNAVAILABLE ]':n,100,388+i*46,27));
  if(message) text(g,message,100,410+names.length*46,24,cyan);
});}
export function connectionWarning(g,scale,message='YOU ARE STILL IN THE SERVER'){draw(g,scale,()=>{panel(g,95,635,850,195);text(g,'CONNECTION LOST',125,704,39);text(g,message,125,760,27,cyan);text(g,'AFTER HOURS / FICTIONAL STORY UI',125,804,17);});}
export const RULES=['Check the camera before serving.','Count the customers twice.','Close the shutter at 03:00.'];
export function ruleCard(g,scale,{rule=0,time='02:59',active=true}={}){draw(g,scale,()=>{
  panel(g,74,315,900,205);text(g,`NIGHT SHIFT   /   ${time}`,101,369,28,cyan);
  text(g,`RULE ${rule+1}${active?' — ACTIVE':''}`,101,419,27);text(g,RULES[rule],101,474,32);
});}
export function cctv(g,scale,{camera='01',time='02:59:58',delayed=false}={}){draw(g,scale,()=>{
  g.strokeStyle=cyan;g.lineWidth=3;g.strokeRect(68,325,890,925);text(g,`CAM ${camera}   ${time}`,89,374,25);text(g,delayed?'DELAYED FEED':'STORY CAMERA',89,1210,23,cyan);
  g.fillStyle='#9ae6dd0b';for(let y=395;y<1190;y+=9)g.fillRect(70,y,886,2);
});}
export function fuelUi(g,scale,value=1){draw(g,scale,()=>{panel(g,74,325,670,119);text(g,'KEEP THE FIRE LIT',99,370,29);g.fillStyle='#465958';g.fillRect(100,394,600,17);g.fillStyle='#ffc475';g.fillRect(100,394,600*Math.max(0,Math.min(1,value)),17);});}
export function cover(g,scale,{headline='THE SERVER WAS EMPTY.',subline='So who copied my wave?',episode='01'}={}){draw(g,scale,()=>{
  // Within the centre 3:4 crop (y=240..1680) and above platform caption controls.
  text(g,'AFTER HOURS',76,276,30,cyan);text(g,headline,76,1325,49);text(g,subline,76,1383,30);text(g,`ORIGINAL ROBLOX-STYLE STORIES    /    ${episode}`,76,1450,21,cyan);
});}
export function receipt(g,scale,{order='ONE DRINK',number='014'}={}){draw(g,scale,()=>{g.fillStyle='#e9d9ad';g.fillRect(155,520,700,610);text(g,'AFTER HOURS',200,600,41,'#14212b');text(g,`ORDER ${number}`,200,675,34,'#14212b');text(g,order,200,755,38,'#14212b');text(g,'CUSTOMERS: 1',200,900,32,'#14212b');text(g,'THANK YOU / 02:59',200,1040,25,'#14212b');});}
