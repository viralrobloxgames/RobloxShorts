"""Create an original, quiet sound-design track and labels for the motion test."""
import math,wave,struct,random,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'demo';OUT.mkdir(exist_ok=True)
rate=48000;duration=8;samples=[0.]*(rate*duration);rng=random.Random(57)
def tone(start,seconds,freq,vol,kind='sine'):
    for i in range(int(seconds*rate)):
        t=i/rate;env=(1-math.exp(-t*140))*math.exp(-t*12/seconds)
        if kind=='step':v=.7*math.sin(2*math.pi*freq*t)*math.exp(-t*45)+.15*rng.uniform(-1,1)*math.exp(-t*90)
        elif kind=='slide':v=math.sin(2*math.pi*(freq*t-90*t*t))
        else:v=math.sin(2*math.pi*freq*t)+.18*math.sin(4*math.pi*freq*t)
        k=round(start*rate)+i
        if k<len(samples):samples[k]+=v*env*vol
for t in (.15,.45,.74,1.03,1.33,1.62,1.92):tone(t,.15,135,.10,'step')
for t,f in [(2.12,523.25),(2.25,659.25),(2.4,783.99)]:tone(t,.38,f,.045)
tone(4.03,.5,620,.055,'slide')
for t,f in [(5.32,280),(5.66,245),(6.03,220),(6.36,185)]:tone(t,.16,f,.025)
for t,f in [(6.85,523.25),(6.99,659.25),(7.16,783.99)]:tone(t,.5,f,.04)
samples=[v*6 for v in samples]
with wave.open(str(OUT/'Motion_Test_Sound.wav'),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate)
    w.writeframes(b''.join(struct.pack('<h',round(max(-.95,min(.95,v))*32767)) for v in samples))
header='''[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Arial,66,&H00FFFFFF,&H00FFFFFF,&H00403125,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,8,45,45,115,1
Style: Small,Arial,20,&H00FFFFFF,&H00FFFFFF,&H00564B42,&H00000000,-1,0,0,0,100,100,2,0,1,1,0,8,45,45,88,1
Style: Beat,Arial,29,&H004C3430,&H004C3430,&H00F6E7DF,&H00F6E7DF,-1,0,0,0,100,100,1,0,3,10,0,2,50,50,178,1
Style: Footer,Arial,18,&H004C3430,&H004C3430,&H00F6E7DF,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,45,45,95,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:08.00,Small,,0,0,0,,CHARACTER TEST / 01
Dialogue: 0,0:00:00.00,0:00:08.00,Title,,0,0,0,,MEET MAX.
Dialogue: 0,0:00:00.00,0:00:08.00,Footer,,0,0,0,,ORIGINAL BLOCK CHARACTER / MOTION PREVIEW
'''
def ass_time(t):
    cs=round(t*100);return f'0:{cs//6000:02}:{cs//100%60:02}.{cs%100:02}'
for s in json.loads((OUT/'shots.json').read_text()):
    header+=f"Dialogue: 1,{ass_time(s['start'])},{ass_time(s['end'])},Beat,,0,0,0,,{s['label']}\n"
(OUT/'Motion_Test.ass').write_text(header,encoding='utf-8')
print('Sound and captions ready')

