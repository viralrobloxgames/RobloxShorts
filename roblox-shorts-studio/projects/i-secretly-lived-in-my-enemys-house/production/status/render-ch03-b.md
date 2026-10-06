STATUS: DONE
render-ch03-b: delivery/chapters/ch03_b.mp4 = ch03 frames 907-2013 (1107 frames, checked with ffprobe: h264 1920x1080 30 fps yuv420p), 17 captions, 16.1 MB; rendered from ch03 at COMMIT 180443c (FRAMES 2013, SPLIT 907); 3 stills checked.
Note: after this render runner.html changed its fingerprint (0b82264, runs scene onBeforeRender), so changed_frames now flags ~1928 of 2013 ch03 frames although ch03.js and the kit did not change. A future re-sync of ch03 B would re-render nearly everything unless frame_hashes.json is regenerated. renders/ch03 is kept on this machine.
