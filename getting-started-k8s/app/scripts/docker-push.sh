#!/usr/bin/env bash

set -efu -o pipefail

readonly script_dir=$(cd "$(dirname "$0")" && pwd)
cd "$script_dir/.."

TIMESTAMP=$(TZ=JST-9 date "+%Y%m%d-%H%M%S")
echo $TIMESTAMP
IMAGE_ID=sisisin/try-pulumi:$TIMESTAMP
echo $IMAGE_ID
docker build -t $IMAGE_ID .
docker build -t sisisin/try-pulumi:latest
docker login
docker push $IMAGE_ID
docker push sisisin/try-pulumi:latest
