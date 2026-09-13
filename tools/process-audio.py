"""Extract first utterance from local compound-final videos; preserve originals."""
import json, subprocess, sys, pathlib, wave
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
sys.path.insert(0, str(WORKSPACE / '.tools'))
import imageio_ffmpeg
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
OUT = ROOT / 'audio' / 'compound'
OUT.mkdir(parents=True, exist_ok=True)
RATE = 24000

def run(*args):
    return subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', *args], check=True, capture_output=True).stdout

report = []
for index, source in enumerate(sorted((WORKSPACE / '結合韻影片').glob('*.mp4')), 1):
    raw = run('-i', str(source), '-vn', '-ac', '1', '-ar', str(RATE), '-f', 's16le', '-')
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    frame = int(RATE * .02)
    energy = np.array([np.sqrt(np.mean(samples[i:i+frame]**2)) for i in range(0, len(samples), frame)])
    threshold = max(.006, float(energy.max()) * .065)
    active = np.flatnonzero(energy > threshold)
    # Join speech fragments separated by < 0.40 s. The larger gap separates repetitions.
    groups = []
    for n in active:
        if not groups or n - groups[-1][-1] > 20:
            groups.append([int(n)])
        else:
            groups[-1].append(int(n))
    # Every source begins with a short identical cue around 0.8 s.
    groups = [g for g in groups if len(g) >= 5 and g[0] * .02 > 1.8]
    if not groups:
        raise RuntimeError('No speech found: ' + source.name)
    start = max(0, groups[0][0] * .02 - .10)
    end = min(len(samples) / RATE, (groups[0][-1]+1) * .02 + .16)
    if len(groups) == 1 and end - start > 3:
        # Find the repeated waveform's lag rather than cutting the file in half.
        reference = samples[int((start+.10)*RATE):int((start+1.2)*RATE):8]
        best = (-1, None)
        for offset in np.arange(2.2, 3.8, 1/3000):
            a = int((start+.10+offset)*RATE)
            candidate = samples[a:a+len(reference)*8:8]
            if len(candidate) == len(reference):
                corr = float(np.dot(reference, candidate) / (np.linalg.norm(reference)*np.linalg.norm(candidate)+1e-9))
                if corr > best[0]: best = (corr, float(offset))
        if best[0] < .6: raise RuntimeError('Ambiguous repetition: '+source.name+' '+str(best))
        end = start + best[1] - .05
    destination = OUT / ('c%02d.mp3' % index)
    run('-y', '-ss', str(start), '-t', str(end-start), '-i', str(source), '-vn', '-ac', '1', '-ar', str(RATE), '-af', 'loudnorm=I=-19:TP=-2:LRA=7,afade=t=in:d=0.025,afade=t=out:st=%.3f:d=0.055' % max(0, end-start-.055), '-b:a', '64k', str(destination))
    report.append({'symbol': source.stem, 'file': 'audio/compound/'+destination.name, 'sourceSeconds': round(len(samples)/RATE,3), 'start':round(start,3), 'end':round(end,3), 'speechGroups':[[round(g[0]*.02,2),round((g[-1]+1)*.02,2)] for g in groups]})

(ROOT / 'audio' / 'compound-manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
