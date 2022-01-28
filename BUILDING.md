# Development
This section contains helpful information for developers.

## Troubleshoot install and build

If you run into trouble while resolving dependencies, try updating Bundler: `gem update --system && gem install bundler`.

Note: If you run into this error while executing `bundle install`
```
An error occurred while installing pg (<some version>), and Bundler cannot continue.
Make sure that `gem install pg -v '<some version>'` succeeds before bundling.
```

Then installing `pg` with `gem install pg -v '0.19.0'` would solve the issue. 
Sometimes it might complain that the `libpq` library is not found. This might happen for several reasons:

* Lib paths are mis-configured.
* `libpq` library is not installed at all. 
* On some platforms setting the `ARCHFLAGS` env to `-arch x86_64` and then installing pg would work. 
  So run this command: `sudo ARCHFLAGS="-arch x86_64" gem install pg -v '<some version>'`

# Maintenance
This section contains package maintenance procedures in preparation for deployment.

* Review, approve, and merge open pull requests into the master branch.
* Tag the master branch with the new version. Use the flag `-s` to sign a tag, or `-a` to create an unsigned tag.
  ```
  git tag -s "0.4.0"
  git push --tags
  ```
* Create a new release from the new tag on GitHub and let GitHub auto-generate release notes. Mark releases used for testing as pre-release. The release bundles the code into an archive, which we'll use for deployment.
* Pushing a new tag will generate a new Docker image with the same tag.

# Deployment
This section contains instructions to deploy Build and the related service build2xlsform to a test or production server.

## docker-compose
This section explains how to run ODK Build with docker-compose.
This is useful for several audiences:

* End users can run this as an offline or self-hosted version of ODK Build. Note, the installation process requires internet connectivity.
* Developers can verify that the Docker builds still work after code changes.
* Maintainers can deploy Build with the same toolset (docker-compose) as Central.

### First time start-up
With Docker and docker-compose installed, run

```
# via HTTPS
git clone https://github.com/getodk/build.git 

# or with SSH keys
git clone git@github.com:getodk/build.git

# or download and extract the latest release from https://github.com/getodk/build/releases
# Replace 0.4.0 with your release version
export BV="0.4.0"
# Verify that the correct release version will be used
echo $BV

wget https://github.com/getodk/build/archive/$BV.tar.gz
tar -xf $BV.tar.gz && mv build-$BV build && rm $BV.tar.gz

cd build
docker-compose up -d --build
```
This will run ODK Build on `http://localhost:9393/`, together with its Postgres database 
and the related service `build2xlsform` providing an export to XLSForm.

### Stop Build
To stop the images, run 

```
docker-compose stop
```

DO NOT run `docker-compose d*wn` as it unlinks the database volume.
To recover from this, follow the troubleshooting protocol 
[here](https://docs.getodk.org/central-troubleshooting/#troubleshooting-docker-compose-down).

### Upgrade Build
Pull the latest changes and rebuild/restart the images.

```
cd build
git pull
docker-compose up -d --build
```

## Source install
The following sections document how to install Build and its dependencies from source.

### Deploy build2xlsform
The symlink `/srv/xls_service/current` points to the unpacked and built production release.

SSH into the relevant server. The server admin will have added your SSH pubkey into `authorized_keys`.
A database will be set up with credentials in a config file at `/srv/odkbuild/config/config.yml`.

```
su - xls_service

# Replace 1.6 with your release version
export B2X="1.6"
# Verify that the correct release version will be used
echo $B2X

cd /srv/xls_service/releases
wget https://github.com/getodk/build2xlsform/archive/$B2X.tar.gz
tar -xf $B2X.tar.gz && mv build2xlsform-$B2X $B2X && rm $B2X.tar.gz
cd $B2X
make
rm /srv/xls_service/current
ln -s /srv/xls_service/releases/$B2X /srv/xls_service/current
# verify that current points to latest release:
ls -l /srv/xls_service/current
exit
service xls-service stop && service xls-service start
service xls-service status
```

### Deploy Build

As root user, upgrade the system, NodeJS, and Ruby Gems.
```
apt update
apt upgrade

# Follow https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04 > update using a PPA
cd ~
curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
sh nodesource_setup.sh
apt install nodejs
# Verify version, here 14.x:
nodejs -v

# Build 0.3.5 to 0.4.0 requires a Ruby upgrade
root@build:~# gem update --system
```
When downgrading, the above steps need to be altered to install the required NodeJS versions (8.x) and Ruby versions (see Gemfile).

```
su - build

# Replace 0.4.0 with your release version
export BV="0.4.0"
# Verify that the correct release version will be used
echo $BV

cd /srv/odkbuild/releases
wget https://github.com/getodk/build/archive/$BV.tar.gz
tar -xf $BV.tar.gz && mv build-$BV $BV && rm $BV.tar.gz
cp /srv/odkbuild/config/config.yml /srv/odkbuild/releases/$BV/config.yml
cd $BV
bundle config set --local deployment 'true'
bundle install
bundle exec rake deploy:build
rm /srv/odkbuild/current
ln -s /srv/odkbuild/releases/$BV /srv/odkbuild/current
# verify that current points to latest release:
ls -l /srv/odkbuild/current
exit
service build-server stop && service build-server start
service build-server status
```

### Troubleshooting: Revert to an older version
Run the above deployment steps with the older version tag.

### Troubleshooting: Update user password
If you need to update your password in the database, get the value of the pepper column in the users table for your user, then:

```
irb
irb(main):001:0> require 'digest/sha1'
irb(main):002:0> Digest::SHA1.hexdigest "--[your_new_password]==[pepper]--"
Put that hash in the password column in the DB.
```
