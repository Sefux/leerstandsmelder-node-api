#!/usr/bin/env bash

mongodump --db="mapoz-api" --out="$1mongo-$(date +"%Y_%m_%d")"
