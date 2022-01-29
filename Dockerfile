FROM ruby:2.7.2
LABEL author="GetODK Inc."
LABEL maintainer="ODK Build maintainers"
LABEL description="ODK Build, a drag-and-drop Xform designer"

# Install system dependencies
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - 
RUN DEBIAN_FRONTEND=noninteractive apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --yes \
  -o Acquire::Retries=10 --no-install-recommends \
  nodejs libpq-dev zlib1g-dev libbz2-dev default-jre \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install Ruby gems and ODK Build
ENV RACK_ENV production
# The build2xlsform hostname is "build2xlsform" when run with docker-compose, 
# not "localhost" (the default) as in a source install.
ENV B2X_HOST build2xlsform
WORKDIR /srv/odkbuild/current

# Files
COPY . ./
COPY ./contrib/config_docker.yml config.yml
COPY ./contrib/start-odkbuild.sh .
RUN mkdir -p /var/odkbuild/ /var/log/odkbuild

# Ruby gems
RUN gem install bundler:2.2.30
RUN bundle config set --local deployment 'true'
RUN bundle install

# ODK Build
RUN bundle exec rake deploy:build

# Run
EXPOSE 9393
# CMD ["bundle", "exec", "rackup", "config.ru"]
CMD ["bundle", "exec", "unicorn", "-E", "production", "-c", "/srv/odkbuild/current/contrib/unicorn.rb"]
