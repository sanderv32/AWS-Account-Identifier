#!/usr/bin/env python
import enum
import os
import sys

import click
import zipfile


class Browsers(str, enum.Enum):
    CHROME = "chrome"
    FIREFOX = "firefox"


def get_files(directory):
    filepaths = []
    for root, directories, files in os.walk(directory):
        for filename in files:
            filepath = os.path.join(root, filename)
            filepaths.append(filepath)
    return filepaths


@click.command()
@click.option('--browser', '-b', required=True, type=click.Choice(Browsers, case_sensitive=False),
              help="Browser family")
@click.option('--extension-name', '-e', required=True,
              help="Extension name")
@click.option('--source-dir', '-s', required=True,
              help="Source directory")
def main(browser: Browsers, extension_name: str, source_dir: str) -> int:
    if browser == Browsers.FIREFOX:
        extension_name = f"{extension_name}.xpi"
    else:
        extension_name = f"{extension_name}.zip"

    if os.path.isdir(source_dir):
        file_paths = get_files(source_dir)
        with zipfile.ZipFile(extension_name, "w") as extension_file:
            for file in file_paths:
                dest_file = file.split(f"{source_dir}")[1]
                if "manifest" in file:
                    if f"manifest-{browser.value}.json" in file:
                        dest_file = "manifest.json"
                    else:
                        continue
                extension_file.write(file, arcname=dest_file)
                print(f"Adding: {file} -> {dest_file}")
    else:
        print(f"Path {source_dir} doesn't exists")
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
