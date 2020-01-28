#!/bin/bash

API="http://localhost:4741"
URL_PATH="/messages"

curl "${API}${URL_PATH}" \
  --include \
  --request POST \
  --header "Content-Type: application/json" \
  --data '{
    "message": {
      "text": "'"${TEXT}"'"
    }
  }'

echo
