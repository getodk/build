# Build Offline
To prepare build to run offline, follow the `docker-compose` deployment steps in the [deployment guide](deploy.md).
Note, you need to be online for these steps.

Once the Docker images are built and the local storage volumes are created, you can run Build offline through

```
cd build
docker-compose up -d
```

and stop Build through

```
cd build
docker-compose stop
```
