#!/bin/sh

set -e

BASEDIR="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
PWDDIR="$(pwd)"

cd $BASEDIR
npm version prerelease --force
npm run build
npm publish --access=public

cd $PWDDIR