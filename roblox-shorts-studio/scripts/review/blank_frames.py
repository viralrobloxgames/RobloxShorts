"""Find blank or blocked frames in an encoded video: frames with almost no detail outside the caption band (a camera
inside a wall, a coffin or a character's body, an empty dead shot). Prints each run with its time; look at every one.
    python3 scripts/review/blank_frames.py projects/<slug>/delivery/<Title>.mp4 [threshold, default 0.3 x median]"""
import subprocess, sys, numpy as np
w,h=216,384
p=subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-vf',f'scale={w}:{h},format=gray','-f','rawvideo','-'],capture_output=True).stdout
fr=np.frombuffer(p,np.uint8).reshape(-1,h,w).astype(np.float32)
keep=np.ones(h,bool); keep[120:172]=False          # skip the caption band
ed=np.array([np.abs(np.diff(f[keep],axis=1)).mean()+np.abs(np.diff(f[keep],axis=0)).mean() for f in fr])
med=np.median(ed); print('frames',len(fr),'median edge %.2f'%med)
low=np.where(ed<med*(float(sys.argv[2]) if len(sys.argv)>2 else 0.3))[0]; runs=[]
for i in low:
    if runs and i==runs[-1][1]+1: runs[-1][1]=i
    else: runs.append([i,i])
for a,b in runs: print(f'{a/30:6.2f}-{b/30:6.2f}s frames {a}-{b} edge {ed[a:b+1].min():.2f}')
