#!/usr/bin/env python
import os.path
import sys
import json

import click


@click.command()
@click.option('--version', '-v', required=True, envvar='VERSION', help='Set version')
@click.argument('version_files', nargs=-1, required=True)
def main(version: str, version_files: list) -> int:
    for f in version_files:
        if os.path.isfile(f):
            with open(f, 'r') as reader:
                buffer = reader.read()
            try:
                buffer = json.loads(buffer)
            except json.JSONDecodeError as e:
                print(f"Error decoding file {f}: {e.msg}")
                return 2
            print(f"Updating file {f} from version {buffer['version']} to {version}")
            buffer['version'] = version
            with open(f, 'w') as writer:
                writer.write(json.dumps(buffer, indent=4))
        else:
            print(f"File {f} doesn't exists")
            return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
