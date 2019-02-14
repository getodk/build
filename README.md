# ODK Build

ODK Build is a web-based, drag-and-drop service for creating forms used with data collection tools such as [ODK Collect](https://opendatakit.org/use/collect/). ODK Build is part of Open Data Kit (ODK), a free and open-source set of tools which help organizations author, field, and manage mobile data collection solutions. Learn more about the Open Data Kit project and its history [here](https://opendatakit.org/about/) and read about example ODK deployments [here](https://opendatakit.org/about/deployments/).

Unless you mean to do development on ODK Build, just go to [https://build.opendatakit.org](https://build.opendatakit.org) to give it a try, or to the [releases page](https://github.com/opendatakit/build/releases) to download a local copy.

## Development

Build is a combination between a Ruby Rack-based application built on Sinatra and a large Javascript frontend. Everything it needs is kicked off by the `config.ru` Rackup file. We use `shotgun` for local development and Phusion Passenger for staging and production deployment.

### Dependencies

All Rubygem dependencies are managed by Ruby Bundler. There are config files present for `rbenv`/`rvm`. Run `bundle install` in the application root to resolve and install the appropriate dependencies. You can do `--without test` to skip some gems if you're short on bandwidth.

We depend on one native binding, to connect to a PostgreSQL database. To satisfy the binding, you can install `libpq-dev` on apt, or `postgresql` on homebrew.

If you run into trouble, see the [building guide](BUILDING.md) for further details.

### Setup and Execution

Now that you have resolved all the appropriate dependencies, you'll need to set up the configuration by copying `config.yml.sample` to `config.yml`. This file contains a number of secret keys and tokens, so be sure not to check it into source control once you put your own keys into it. Note that the `cookie_ssl_only` flag should only be set to true if you are serving your requests on HTTPS; it should likely remain off for local development.

Next, you want to start up your databases. Create a database in your Postgres instance according to how you populated `config.yml`, then run `rake db:migrate` to run migrations against that database. Ideally, create the database with an encoding of `UTF8`.

If you are using the development settings for the config file, you'll want to do this:

```
create role odkbuild with login password 'odkbuild';
create database odkbuild with owner='odkbuild' encoding='utf8';
```

Finally, you'll want to run `bundle exec rackup config.ru` to start the server, or `bundle exec shotgun config.ru` if you want the application to automatically detect your changes to source code and load them up when you refresh the app in your web browser.

If you're running Build in a production environment, there are a couple of things that the application needs to build before it will run. Before first-run, and after each time you update with a new version, you'll want to run `rake deploy:build`. This will bundle all the assets the application needs for speed an ease of deployment.

## Offline Version

There is a separate native-desktop build of ODK Build that is actively maintained; versions of it may be downloaded under the [releases page](https://github.com/opendatakit/build/releases), and the code for it is found under the `offline` branch of this repository. It uses [NWjs](https://nwjs.io/) (formerly `node-webkit`), which is similar to [Electron](https://electron.atom.io/) (but pre-dated it, as does this branch). The code is substantially shared with the Javascript aspects of the main build, with the main differences being the removal of all Ruby server code and the addition of some code to handle the window shell and filesystem operations.

A full README for developers wanting to work on this version [is available](https://github.com/opendatakit/build/blob/offline/README.textile) in the root of the `offline` branch.

### Contributing

Pull requests are welcome! Please be sure you follow existing conventions: braces on newlines, 4-width soft tabs, single-quoted strings, and so on. Don't be shy about submitting living pull requests early, so we can all work together to refine your contribution. See the [full contribution guide](CONTRIBUTING.md) for further details.

### License

Build is licensed under the [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0) license.

