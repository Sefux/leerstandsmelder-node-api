#!/usr/bin/env bash

mongodump --db="leerstandsmelder-api" --out="$1mongo-$(date +"%Y_%m_%d")"
