#!/usr/bin/env bash
# Put this file in backend/ (next to manage.py).
# Make it executable:  git update-index --chmod=+x backend/build.sh
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --no-input
