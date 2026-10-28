"""Build a static test-site ZIP without publishing or reading credentials."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--channel',choices=['preview','github-pages'],default='preview')
parser.add_argument('--output',type=Path,default=Path('/tmp/star-wish-preview'))
args=parser.parse_args()
args.output.mkdir(parents=True,exist_ok=True)
dist=root/'dist'
files={}
for path in sorted(dist.rglob('*')):
    if not path.is_file():
        continue
    if not path.resolve().is_relative_to(dist.resolve()):
        raise SystemExit('Refusing an asset outside dist')
    relative=path.relative_to(dist).as_posix()
    if relative=='viewport-debug.js':
        continue
    data=path.read_bytes()
    if relative=='index.html':
        data=data.replace(b'<script src="viewport-debug.js"></script>',b'')
    files[relative]=data
checksums={name:hashlib.sha256(data).hexdigest() for name,data in files.items()}
build_id=hashlib.sha256(json.dumps(checksums,sort_keys=True).encode()).hexdigest()[:16]
info={'build_id':build_id,'channel':'remake-preview' if args.channel=='preview' else 'github-pages','chapters':4,'stages':12,'guardians':6,'files':checksums}
files['build-info.json']=(json.dumps(info,ensure_ascii=False,indent=2)+'\n').encode()
# Netlify reads this optional file. Other static hosts may safely ignore it.
if args.channel=='preview':
    files['_headers']=b'/*\n  Cache-Control: no-cache\n'
else:
    files['.nojekyll']=b''
archive=args.output/f'star-wish-{args.channel}-{build_id}.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for name,data in files.items():
        z.writestr(name,data)
# Verify the archive before reporting it as uploadable.
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for name,digest in checksums.items():
        assert hashlib.sha256(z.read(name)).hexdigest()==digest
(args.output/'build-info.json').write_bytes(files['build-info.json'])
print(json.dumps({'build_id':build_id,'archive':str(archive),'files':len(files),'bytes':archive.stat().st_size},ensure_ascii=False))
