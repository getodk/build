# Architecture
This document provides a high-level overview of how Build works.

Build is a combination between a Ruby Rack-based application built on Sinatra and a large Javascript frontend.
Everything it needs is kicked off by the config.ru Rackup file.
We use [shotgun](https://github.com/rtomayko/shotgun) for local development and
[docker-compose](https://docs.docker.com/compose/) for staging and production deployment.

## Secrets
The file `config.yml` created from template `config.yml.sample` holds database credentials and other sensitive settings.

## Backend
Ruby Rack, Sinatra
The export to XLSForm depends on `build2xlsform`. Follow its README to install and run `build2xlsform` locally on its default port 8686.

## Frontend
The frontend is written in Vanilla JS, it uses no frameworks and no modern syntax.

## Database
Build uses a Postgres database.
The `docker-compose` deployment provisions its own Postgres container and stores data in a Docker volume.
A source install requires an existing Postgres database to be created with correct credentials kept in `config.yml`.

## Dependencies
<!-- Ruby, Ruby env, system libraries -->
All Rubygem dependencies are managed by Ruby Bundler. There are config files present for `rbenv`/`rvm`.
Run bundle install in the application root to resolve and install the appropriate dependencies.
You can do `--without test` to skip some gems if you're short on bandwidth.

We depend on one native binding, to connect to a PostgreSQL database.
To satisfy the binding, you can install `libpq-dev` on apt, or `postgresql` on homebrew.

## Navigating the code
### Ruby

The Ruby code manages user accounts and form storage, in addition to serving as a sort of proxy gateway to perform functions not available in web browers. Most of the relevant code is in `odkbuild_server.rb`, organized by API section. Note that all permissions checks are done directly inline, as exemplified by the code definition for `put '/user/:username'`.

`asset_manager.rb` and `config_manager.rb` are small utilities that read up and manage, respectively, Javascript assets that the web frontend needs, and database configurations that the server needs. `warden_odkbuild.rb` handles parsing and verifying the user's authentication status. Model and database code are found in `/model`, and some miscellenia in `/lib`.

### Javascript
Most of what the user actually interacts with is purely in Javascript. It's all located within `/public/javascripts`.

The two most likely things you may wish to do are:

* Change how a type of control works, or add a new control type. You'll want to check out the bottom of `controls.js`, and then take a look at `data.js` to define how your changes or additions serialize to XForms XML. (These should be unified to a simple one-stop location in an imminent release similar to `impl.validation.js` below.)
* Modify or add a validation. For this, the only place you should really have to look is `impl.validation.js`.

Otherwise, files of note include:

* `data.js` handles all kinds of top-level form data processing: serializing form data for storage, loading it back in, exporting to XML, etc.
* `data-ui.js`, which handles all user interactions around dealing with entire forms: opening, closing, exporting, etc; anything that calls into `data.js` is probably here.
* `options-editor.js` is the code underlying the pop-up options editor experience.
* `property-editor.js` renders and manages all of the property controls that appear in the right sidebar, and pushes updates back into the control.
* `core.validation.js` is the core code that routes data in order to _perform_ validation, as opposed to `impl.validation.js` which _defines_ how the validations behave.

### build2xlsform
[build2xlsform](https://github.com/getodk/build2xlsform) is a simple library and webservice that takes ODK Build form data and converts it to XLSForm-compatible XLSX files. It supports all features in ODK Build and is actively maintained to keep it such. In minor instances, this exceeds XLSForm's own expressivity of XForms features, and in such cases we export lossy information and leave a message in a 'Warnings' spreadsheet. It is currently actively deployed on the production Build instance.

Some changes, like adding support for a new field type, might require an addition to `build2xlsform`. Make sure to test that the export to XLSForm yields a valid XLSForm.

## Deployment architecture
<!-- docker compose -->
Build is most recently deployed via `docker compose`, which brings its own database and `build2xlsform` containers.
A bind mount provides a pathway for database dumps to be transferred in and out of the container.

<!-- Historical: ansible, source -->
In the distant past, Build up to version 0.3.5 was deployed via
[ansible](https://github.com/getodk/build/tree/ansible-deployment) as automated source install behind an nginx server.
After the Great Spring Clean of 2021&trade;, Build 0.3.6 through 0.4.1 was deployed as a manual source install.

## Offline version
<!-- Run docker compose locally. -->
The offline version consists of the Build code run through `docker compose` on a local machine.

