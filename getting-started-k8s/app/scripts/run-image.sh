#!/usr/bin/env bash

set -efu -o pipefail

readonly script_dir=$(cd "$(dirname "$0")" && pwd)
cd "$script_dir/.."

docker run -p 3000:3000 sisisin/try-pulumi:latest
