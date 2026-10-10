"""Restore checkout-only CRLF conversion, then verify the original manifest.

Never change the manifest or accept different source/model content.
"""
import argparse
import hashlib
import json
from pathlib import Path


def verify_runtime_bundle(root):
    root = Path(root).resolve()
    manifest = json.loads((root / 'MANIFEST.json').read_text(encoding='utf-8'))
    if manifest.get('sanitizer_version') != 1:
        raise ValueError('Only sanitized public bundles are accepted')
    repairs = []
    for entry in manifest['files']:
        path = (root / entry['path']).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            raise ValueError(f"Missing or unsafe public bundle file: {entry['path']}")
        body = path.read_bytes()
        if hashlib.sha256(body).hexdigest() == entry['sha256']:
            continue
        # Only known text formats may have checkout line endings repaired.
        # The repaired bytes must match the ORIGINAL hash exactly.
        restored = body.replace(b'\r\n', b'\n')
        if path.suffix.lower() in {'.csv', '.json', '.md'} and hashlib.sha256(restored).hexdigest() == entry['sha256']:
            repairs.append((path, restored))
        else:
            raise ValueError(f"Public bundle checksum mismatch: {entry['path']}. Restore the original verified file; content changes cannot be repaired automatically.")
    # Verify every file before writing any repair; binary models stay untouched.
    for path, body in repairs:
        path.write_bytes(body)
        print(f'Restored original LF bytes: {path.relative_to(root)}')
    print(f"Verified {len(manifest['files'])} public bundle files against the original manifest")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('root')
    verify_runtime_bundle(parser.parse_args().root)
