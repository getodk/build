# Deployment
This section contains instructions to deploy Build and the related service build2xlsform to a test or production server.
The two alternatives are a deployment via `docker-compose` and a source install.

## docker-compose
This section explains how to run ODK Build with `docker-compose`.
This is useful for several audiences:

* End users can run this as an offline or self-hosted version of ODK Build. Note, the installation process requires internet connectivity.
* Developers can verify that the Docker builds still work after code changes.
* Maintainers can deploy Build with the same toolset (`docker-compose`) as Central.

### First time start-up
With Docker and docker-compose installed, run

```
# via HTTPS
git clone https://github.com/getodk/build.git 

# or with SSH keys
git clone git@github.com:getodk/build.git
```

#### Current ODK Build master
The file `docker-compose.dev.yml` will deploy the latest tagged image for build2xlsform from ghcr.io,
and build the current master as ODK Build image.
Developers will use this option to test ODK Build during development.
A copy of this command is also mentioned in `docker-compose.dev.yml`. 

```
cd build
git pull
docker-compose -f docker-compose.dev.yml up -d --build
```

This will run ODK Build on `http://0.0.0.0:9393/`, together with its Postgres database 
and the related service `build2xlsform` providing an export to XLSForm.

#### Latest official images
The file `docker-compose.yml` will deploy the latest tagged images from ghcr.io,
which are built and pushed whenever a commit is pushed to GitHub.
Maintainers will use this option to deploy ODK Build to a staging or production server.

```
docker-compose up -d
```

### Stop Build
To stop the images, run 

```
docker-compose stop
```

The named database volume will survive even a destructive `docker-copmose down`, which removes
both downloaded and locally built images as well as unnamed volumes.

### Upgrade Build
Pull the latest changes and rebuild/restart the images.

```
cd build
git pull
docker-compose up -d --build
```

### Transfer database snapshots
Both `docker-compose` files mount a transfer directory. 
On the host, `docker-compose` is run from the cloned Build repository. 
A folder `transfer` is created inside the cloned repository, which is mounted inside the `postgres` container as `/var/transfer`.

This bind mount can be used to either transfer a database dump from the host (or another machine) into the Docker container,
or transfer a database dump from the container to the host (or another machine).

```
root@build-staging:/srv/odkbuild/current# pg_dump -h localhost -U odkbuild -d odkbuild -W -Fc > transfer/db.dump
```

To restore the database dump into the container:

```
# Find the container name: build_odkbuild_1
> docker-compose ps
        Name                       Command               State                    Ports                  
---------------------------------------------------------------------------------------------------------
build_build2xlsform_1   docker-entrypoint.sh node  ...   Up      0.0.0.0:8686->8686/tcp,:::8686->8686/tcp
build_odkbuild_1        ./contrib/wait-for-it.sh p ...   Up      0.0.0.0:9393->9393/tcp,:::9393->9393/tcp
build_postgres_1        docker-entrypoint.sh postgres    Up      5432/tcp                                

# Attach to the running container
> docker exec -it build_postgres_1 /bin/bash -c "export TERM=xterm; exec bash"

# Option 1: Restore a database dump
root@308c22617da1:/# pg_restore -U odkbuild -f /var/transfer/db.dump

# Option 2: Save a database dump
root@308c22617da1:/# pg_dump -U odkbuild -Fc > /var/transfer/db.dump
```

From the host system, the database dump is now accessible as `transfer/db.dump` in the cloned Build source repository.

```
root@build-staging:/srv/odkbuild/current# pg_restore -h localhost -U odkbuild -d odkbuild -W < transfer/db.dump
```



## Production deployment from source
This section documents how to deploy Build to a production server via a source install.
This deployment method has been superseded by the docker-compose deployment.

### Deploy build2xlsform
The symlink `/srv/xls_service/current` points to the unpacked and built production release.

SSH into the relevant server. The server admin will have added your SSH pubkey into `authorized_keys`.
A postgres database will be set up with credentials in a config file at `/srv/odkbuild/config/config.yml`.

```
su - xls_service

# Replace 1.9 with your release version
export B2X="1.9"
# Verify that the correct release version will be used
echo $B2X

cd /srv/xls_service/releases
wget https://github.com/getodk/build2xlsform/archive/$B2X.tar.gz
tar -xf $B2X.tar.gz && mv build2xlsform-$B2X $B2X && rm $B2X.tar.gz
cd $B2X
make
ln -sf /srv/xls_service/releases/$B2X /srv/xls_service/current
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

# Replace 0.4.2 with the latest release version
export BV="0.4.2"
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
ln -sf /srv/odkbuild/releases/$BV /srv/odkbuild/current
# verify that current points to latest release:
ls -l /srv/odkbuild/current
exit
service build-server stop && service build-server start
service build-server status
```

### Troubleshooting: Revert to an older version
Run the above deployment steps with the older version tag. You may have to downgrade NodeJS or Ruby.

### Troubleshooting: Update user password
If you need to update your password in the database, get the value of the pepper column in the users table for your user, then:

```
irb
irb(main):001:0> require 'digest/sha1'
irb(main):002:0> Digest::SHA1.hexdigest "--[your_new_password]==[pepper]--"
Put that hash in the password column in the DB.
```