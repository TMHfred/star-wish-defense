"""Create/reuse only this helper's independent Netlify test site; never GitHub Pages."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener
import zipfile


class NoRedirect(HTTPRedirectHandler):
    # Never forward the bearer header to a different destination.
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive',type=Path,nargs='?')
    parser.add_argument('--state',type=Path,default=Path('/tmp/star-wish-preview/netlify-state.json'))
    parser.add_argument('--status',action='store_true',help='Read the last deploy state without creating or uploading')
    args=parser.parse_args()
    token=os.environ.get('NETLIFY_AUTH_TOKEN')
    if not token:
        raise RuntimeError('Missing NETLIFY_AUTH_TOKEN. Supply it securely in environment settings.')
    opener=build_opener(NoRedirect())

    def api(method,path,body=None,content_type='application/json'):
        request=Request('https://api.netlify.com/api/v1/'+path,data=body,method=method,
            headers={'Authorization':'Bearer '+token,'Content-Type':content_type})
        try:
            with opener.open(request,timeout=60) as response:
                return json.load(response)
        except HTTPError as error:
            raise RuntimeError('Netlify API HTTP '+str(error.code)+'; response body omitted to protect credentials.') from None
        except URLError:
            raise RuntimeError('Unable to reach Netlify API through the configured network route.') from None

    state={}
    if args.state.exists():
        state=json.loads(args.state.read_text())
        if state.get('managed_by')!='star-wish-remake-preview' or not isinstance(state.get('site_id'),str):
            raise RuntimeError('State is not owned by this preview helper; refusing to deploy.')

    def save():
        args.state.parent.mkdir(parents=True,exist_ok=True)
        temporary=args.state.with_suffix('.tmp')
        temporary.write_text(json.dumps(state,indent=2)+'\n')
        temporary.replace(args.state)

    if not args.status:
        if not args.archive:
            parser.error('archive is required for upload')
        with zipfile.ZipFile(args.archive) as archive:
            info=json.loads(archive.read('build-info.json'))
            if info.get('channel')!='remake-preview':
                raise RuntimeError('Only remake-preview archives are accepted.')
            for name,digest in info['files'].items():
                if hashlib.sha256(archive.read(name)).hexdigest()!=digest:
                    raise RuntimeError('Archive checksum mismatch.')
            expected=hashlib.sha256(json.dumps(info['files'],sort_keys=True).encode()).hexdigest()[:16]
            if info['build_id']!=expected:
                raise RuntimeError('Build identifier mismatch.')
        if not state:
            created=api('POST','sites',b'{}')
            state={'managed_by':'star-wish-remake-preview','site_id':created['id']}
            save() # Keep the new site's identity even if the upload fails.
        deploy=api('POST','sites/'+quote(state['site_id'],safe='')+'/deploys',args.archive.read_bytes(),'application/zip')
        state.update({'deploy_id':deploy['id'],'build_id':info['build_id']})
        state.pop('preview_url',None)
        save()
    if not state.get('deploy_id'):
        raise RuntimeError('No uploaded deploy to check yet.')
    deploy=api('GET','deploys/'+quote(state['deploy_id'],safe=''))
    state['state']=deploy.get('state','unknown')
    # A generated URL is not readiness evidence. Return it only for a ready deploy.
    if state['state']=='ready':
        url=deploy.get('deploy_ssl_url') or deploy.get('ssl_url')
        parsed=urlparse(url or '')
        if parsed.scheme!='https' or not (parsed.hostname or '').endswith('.netlify.app'):
            raise RuntimeError('Unexpected preview URL; inspect Netlify before continuing.')
        state['preview_url']=url
    save()
    print(json.dumps({k:state[k] for k in ['site_id','deploy_id','build_id','state','preview_url'] if k in state}))


if __name__=='__main__':
    try:
        main()
    except (RuntimeError,ValueError,KeyError,OSError,zipfile.BadZipFile) as error:
        # Do not include raw SDK responses, request headers, or token values.
        if isinstance(error,RuntimeError):
            print(str(error),file=sys.stderr)
        else:
            print('Invalid deployment input or state; no credential details printed.',file=sys.stderr)
        sys.exit(2)
