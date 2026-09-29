"""Contact sheet of evenly spaced frames for reviewing a farm test or a finished sequence.

python contact_sheet.py --frames <png-folder> --out <sheet.jpg> [--count 18] [--fps 30] [--title "..."]
Frame numbers are read from the end of each file name, so GarageFarm names work as-is.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import argparse,re
p=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
p.add_argument('--frames',required=True);p.add_argument('--out',required=True);p.add_argument('--count',type=int,default=18)
p.add_argument('--fps',type=float,default=30);p.add_argument('--title',default='MOTION REVIEW');a=p.parse_args()
num=lambda f:int(re.search(r'(\d+)$',f.stem).group(1))
files=sorted((f for f in Path(a.frames).glob('*.png') if re.search(r'(\d+)$',f.stem)),key=num)
if not files:raise SystemExit('No numbered PNG frames found.')
step=max(1,len(files)/a.count);selected=[files[min(len(files)-1,round(i*step))] for i in range(min(a.count,len(files)))]
def font(name,size):
    try:return ImageFont.truetype(name,size)
    except OSError:return ImageFont.load_default()
w,h=180,320;rows=(len(selected)+5)//6
im=Image.new('RGB',(6*w,rows*(h+26)+56),'#152136');d=ImageDraw.Draw(im)
d.text((16,16),a.title,font=font('arialbd.ttf',22),fill='white');small=font('arial.ttf',14)
for i,f in enumerate(selected):
    tile=Image.open(f).convert('RGB').resize((w,h),Image.Resampling.LANCZOS);n=num(f)
    x=(i%6)*w;y=56+(i//6)*(h+26);im.paste(tile,(x,y));d.text((x+8,y+h+4),f'{(n-1)/a.fps:.2f}s  /  frame {n}',font=small,fill='white')
im.save(a.out,quality=92);print(a.out)
