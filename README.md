# ODK Build

ODK Build is a web-based, drag-and-drop service for creating forms used with tools such as [ODK Collect](https://opendatakit.org/use/collect/) for data collection. ODK Build is part of Open Data Kit (ODK), a free and open-source set of tools which help organizations author, field, and manage mobile data collection solutions. Learn more about the Open Data Kit project and its history [here](https://opendatakit.org/about/) and read about example ODK deployments [here](https://opendatakit.org/about/deployments/).

Unless you mean to do development on ODK Build, just go to [http://build.opendatakit.org](http://build.opendatakit.org) to give it a try, or to the [releases page](https://github.com/opendatakit/build/releases) to download a local copy.

## Development

Build is a combination between a Ruby Rack-based application built on Sinatra and a large Javascript frontend. Everything it needs is kicked off by the config.ru Rackup file. We use `shotgun` for local development and Phusion Passenger for staging and production deployment.

### Dependencies

The project has one native dependency: Tokyo Tyrant. We use this as our datastore. You'll have to build it natively for any system you want to run the server on. See [http://fallabs.com/tokyotyrant/](http://fallabs.com/tokyotyrant/) for details.

All Rubygem dependencies are managed by Ruby Bundler. Make sure you have at least version 1.0.0 of Bundler installed (`gem update --system && gem install bundler` if you don't have it already). On a Mac, you will need to install the Tokyo Tyrant gem separately as described [here](https://github.com/opendatakit/build/wiki/Installing-Tokyo-Tyrant-gem-(on-Mac)). Then run `bundle install` in the application root to resolve and install the appropriate dependencies.

### Setup and Execution

Now that you have resolved all the appropriate dependencies, you'll need to set up the configuration by copying `config.yml.sample` to `config.yml`. This file contains a number of secret keys and tokens, so be sure not to check it into source control once you put your own keys into it.

Next, you want to start up your databases. You'll need to start four Tokyo Tyrant instances, one for each listing in the configuration file. If you're working from a development environment, you can do this simply by running `rake db:dev:start`, and `rake db:dev:stop` to stop them again.

Finally, you'll want to run `bundle exec rackup config.ru` to start the server, or `bundle exec shotgun config.ru` if you want the application to automatically detect your changes to source code and load them up when you refresh the app in your web browser.

If you're running Build in a production environment, there are a couple of things that the application needs to build before it will run. Before first-run, and after each time you update with a new version, you'll want to run `rake deploy:build`. This will bundle all the assets the application needs for speed an ease of deployment.

### Contributing

Pull requests are welcome! Please be sure you follow existing conventions: braces on newlines, 4-width soft tabs, single-quoted strings, and so on. Don't be shy to submit living pull requests early, so we can all work together to refine your contribution. See the [full conttribution guide](CONTRIBUTING.md) for further details.

### License

Build is licensed under the [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0) license.