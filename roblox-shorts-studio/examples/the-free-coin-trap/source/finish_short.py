"""Mix audio, prepare timed captions, then encode downloaded farm PNGs when present."""
from pathlib import Path
import json, math, wave, array, random, subprocess, shutil, sys, re
P=Path(__file__).resolve().parents[1];STUDIO=P.parents[1];sys.path.insert(0,str(STUDIO/'scripts'))
from settings import tools,executable
FF=executable(tools(),'ffmpeg');DURATION=21.7
A=P/'audio';D=P/'delivery';D.mkdir(exist_ok=True)
assets=STUDIO/'assets'
fontdir=P/'assets/fonts';fontdir.mkdir(exist_ok=True)
shutil.copy2(assets/'fonts/LuckiestGuy-Regular.ttf',fontdir/'LuckiestGuy-Regular.ttf')
shutil.copy2(assets/'fonts/LuckiestGuy-LICENSE.txt',fontdir/'LuckiestGuy-LICENSE.txt')
rate=48000;samples=array.array('f',[0])*(math.ceil(DURATION*rate));rng=random.Random(17)
def tone(start,seconds,hz,level,fall=0):
    for i in range(round(seconds*rate)):
        t=i/rate;j=round(start*rate)+i
        if j>=len(samples):break
        v=math.sin(math.tau*(hz*t+fall*t*t))+.22*math.sin(math.tau*hz*2.03*t)
        samples[j]+=v*level*(1-math.exp(-t*200))*math.exp(-t*6/seconds)
tone(2.86,.13,180,.17);tone(3.88,.55,1320,.16)
for i in range(72):tone(5.5+i*.149,.16,rng.choice([1046,1318,1568,1760]),.025)
tone(8.6,.3,440,.12);tone(8.9,.3,660,.12);tone(16.30,.45,880,.16)
tone(19.97,.32,165,.25,-120);tone(20.13,.55,780,.14,-300)
with wave.open(str(A/'coin_sfx.wav'),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(array.array('h',(round(max(-.98,min(.98,x))*32767) for x in samples)).tobytes())
shutil.copy2(assets/'audio/playful_history_music.wav',A/'music.wav')
subprocess.run([str(FF),'-y','-i',str(A/'narration.mp3'),'-stream_loop','-1','-i',str(A/'music.wav'),'-i',str(A/'coin_sfx.wav'),'-filter_complex',f'[0:a]apad,atrim=0:{DURATION},volume=1.4[v];[1:a]atrim=0:{DURATION},volume=0.065,afade=t=out:st=20.7:d=1[m];[2:a]volume=0.7[s];[v][m][s]amix=inputs=3:normalize=0,alimiter=limit=0.95,loudnorm=I=-16:TP=-1.5:LRA=9[a]','-map','[a]','-ar','48000',str(A/'final_mix.wav')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
def ts(t):
    c=round(t*100);return f'{c//360000}:{c//6000%60:02}:{c//100%60:02}.{c%100:02}'
header='''[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Words,Luckiest Guy,74,&H00FFFFFF,&H003DDAFF,&H00152435,&H80000000,0,0,0,0,100,100,1,0,1,5,2,2,80,80,325,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
caps=json.loads((A/'alignment/captions.json').read_text())
for cap in caps:
    words=cap['words']
    for i,word in enumerate(words):
        start=word['start'];end=words[i+1]['start'] if i+1<len(words) else cap['end']
        if end<=start:continue
        line=' '.join((r'{\c&H003DDAFF&}' if k==i else r'{\c&H00FFFFFF&}')+w['word'].strip().upper() for k,w in enumerate(words))
        header+=f'Dialogue: 0,{ts(start)},{ts(end)},Words,,0,0,0,,{line}\n'
(D/'The_Free_Coin_Trap.ass').write_text(header,encoding='utf-8')
shutil.copy2(A/'alignment/captions.srt',D/'The_Free_Coin_Trap.srt')
print('Final mix and word-timed captions ready.')
if '--encode' in sys.argv:
    frames=list((P/'renders/farm').glob('*.png'))
    def number(p):
        match=re.search(r'(\d+)$',p.stem)
        if not match:raise RuntimeError(f'Cannot find the frame number in {p.name}')
        return int(match.group(1))
    frames.sort(key=number)
    if [number(p) for p in frames]!=list(range(1,652)):raise RuntimeError(f'Need exactly frames 1 through 651, without duplicates. Found {len(frames)} files.')
    seq=P/'renders/encode';seq.mkdir(exist_ok=True)
    for i,f in enumerate(frames,1):shutil.copy2(f,seq/f'{i:04}.png')
    subprocess.run([str(FF),'-y','-framerate','30','-start_number','1','-i','renders/encode/%04d.png','-i','audio/final_mix.wav','-vf',"ass=delivery/The_Free_Coin_Trap.ass:fontsdir=assets/fonts",'-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-t',str(DURATION),'delivery/The_Free_Coin_Trap.mp4'],cwd=P,check=True)
    subprocess.run([str(FF),'-v','error','-i','delivery/The_Free_Coin_Trap.mp4','-f','null','-'],cwd=P,check=True)
