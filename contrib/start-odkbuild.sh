#!/bin/bash

set -e

# Apply database migrations
echo "Apply database migrations..."
bundle exec rake db:migrate --trace

# Run dev server
# echo "Starting development server..."
# bundle exec shotgun config.ru

# Run prod server
echo "Starting production server..."
bundle exec unicorn -E production -c /srv/odkbuild/current/contrib/unicorn.rb
