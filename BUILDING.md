## Troubleshoot

If you run into trouble while resolving dependencies, try updating Bundler: `gem update --system && gem install bundler`.

Note: If you run into this error while executing `bundle install`
```
An error occurred while installing pg (<some version>), and Bundler cannot continue.
Make sure that `gem install pg -v '<some version>'` succeeds before bundling.
```

Then installing `pg` with `gem install pg -v '0.19.0'` would solve the issue. Sometimes it might complain that the `libpq` library is not found. This might happen for several reasons:
* Lib paths are mis-configured.
* `libpq` library is not installed at all. 
* On some platforms setting the `ARCHFLAGS` env to `-arch x86_64` and then installing pg would work. So run this command: `sudo ARCHFLAGS="-arch x86_64" gem install pg -v '<some version>'`