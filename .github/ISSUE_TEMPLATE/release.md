---
name: Release Issue
about: Prepare a new ODK Build release
title: 'Release x.x.x'
labels: infrastructure
assignees: 

---
<!-- Update the x.x.x to the intended version. Update the issue title. -->

## Preparation
- [ ] Review and merge all outstanding PRs
- [ ] Release build2xlsform
- [ ] Update and PR the hard-coded build and build2xlsform versions in 
  - [ ] `server/views/index.erb` > About
  - [ ] `docs/deploy.md` > Source install
  - [ ] `docker-compose.yml`
- [ ] Release versions triple-checked on GitHub master  
- [ ] On GitHub, create a release from latest master: create new tag of release version on push, auto-generate release notes, add any text.


## Acceptance testing
- [ ] <https://staging.build.getodk.org/> upgraded to latest release following deployment guide for `docker-compose`
- [ ] Staging tested and new features verified (post screenshots / test logs as comments below)
- [ ] Core team sign-off for prod server upgrade

## Deployment
- [ ] <https://build.getodk.org/> upgraded
- [ ] <https://build.getodk.org/> up and running with new version
