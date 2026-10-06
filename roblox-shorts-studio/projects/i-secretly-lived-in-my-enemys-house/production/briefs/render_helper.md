# Render helper brief

Role `render-chNN-b`: render **segment B** of chapter NN, frames {A}-{B} (the chapter session renders segment A).
1. `git pull` main; make sure `web/chNN.js` is the version the chapter's status file marks READY_TO_RENDER (commit {SHA}).
2. Fit check must be current for that clip (`node web/fit_check.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/chNN.js`;
   it is reviewed by the chapter session; if it says the check is stale, stop and say so in your status file).
3. Render in the background (timeout 7200000): `node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/chNN.js --out projects/i-secretly-lived-in-my-enemys-house/renders/chNN --frames {A}-{B} --workers 4 --resume`.
4. Encode the segment: `python3 scripts/finish_longform.py projects/i-secretly-lived-in-my-enemys-house --chapter NN --frames projects/i-secretly-lived-in-my-enemys-house/renders/chNN --range {A}-{B}` (see its --help) →
   `delivery/chapters/chNN_b.mp4`; check it decodes and has (B-A+1) frames; push; status file `STATUS: DONE`.
5. Keep the frames: if the final review asks for fixes in your range, you'll get a message to re-render the changed frames
   (`node web/changed_frames.mjs ... --delete`, then `--resume`) and re-encode.
Status file: `production/status/render-chNN-b.md`.
