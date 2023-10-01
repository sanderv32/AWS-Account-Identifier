#!/usr/bin/env python
import os.path
import sys
import json
from pathlib import PurePath

import click


@click.command()
@click.option('--version', '-v', required=True, envvar='VERSION', help='Set version')
@click.argument('version_files', nargs=-1, required=True)
def main(version: str, version_files: list) -> int:
    for f in version_files:
        if os.path.isfile(f):
            base_dir = PurePath(f).parents[0]
            print(base_dir)
            with open(f, 'r') as reader:
                buffer = reader.read()
            try:
                buffer = json.loads(buffer)
            except json.JSONDecodeError as e:
                print(f"Error decoding file {f}: {e.msg}")
                return 2
            buffer['version'] = version
            with open(f, 'w') as writer:
                writer.write(json.dumps(buffer, indent=4))
        else:
            print(f"File {f} doesn't exists")
            return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
