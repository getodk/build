# ODK Build

ODK Build is a web-based, drag-and-drop service for creating forms used with data collection tools such as [ODK Collect](https://opendatakit.org/use/collect/). ODK Build is part of Open Data Kit (ODK), a free and open-source set of tools which help organizations author, field, and manage mobile data collection solutions. Learn more about the Open Data Kit project and its history [here](https://opendatakit.org/about/) and read about example ODK deployments [here](https://opendatakit.org/about/deployments/).

This branch is for committing and tracking a set of deployment scripts that use a combination of Ansible, Nginx, Unicorn, Postgres, and Wal-e to automatically push a fully functional instance of ODK Build, with offsite AWS S3 backups and optional SSL support, to any Ansible target server.

# Setup and Execution

## Manually provisioning an extant target

1. We recommend taking a look at the [Ansible getting started guide](http://docs.ansible.com/ansible/intro_getting_started.html) to make sure you understand and are set up for the basics of Ansible.
2. Once you are, copy `config/build.yml.sample` to `config/build.yml` and take a look at it for information you need to plug in.
3. Your target machine _must_ have the following configured:
    * Ubuntu 16.x LTS. Other distributions or version may work but are not officially supported.
    * An OpenSSH server (`apt-get install openssh-server`).
    * A provisioning user with sudo privileges; this username is in `config/build.yml` as `users.provisioning_user`.
    * Either non-password (`NOPASSWD`) sudo on said user, or a password with which to sudo (in which case add `--ask-sudo-pass` to your `ansible-playbook` command).
    * A way to SSH into your target machine with said provisioning user.
4. Fetch the required Ansible Galaxy roles: `ansible-galaxy install -r requirements.yml -p roles`.
5. Then run `ansible-playbook -i hosts playbook.yml` to kick it all off. You'll have to create the `hosts` file yourself.
    * Once your machine is successfully set up, you can use `deploy.yml` instead of `playbook.yml` to push new versions of Build to your targets.

## Provisioning a test machine via Vagrant

Everything should be set up already; just `vagrant up`. The `Vagrantfile` allocates the machine at the local bridge IP `192.168.33.10`, which you can hit after successful provisioning to access the application.

# Important notes

* The `requirements.yml` file specifies some specific patches that are currently pending merger or publish; if you install from that file you will be okay, but otherwise you'll have to watch out for some bugs:
    * There is currently an issue with the latest versions of Ansible which necessitate a quick patch of `roles/ANXS.postgresql/tasks/install.yml`; see [this issue](https://github.com/ANXS/postgresql/issues/223) for further information. The change has been merged but has yet to be published to Galaxy.
    * Pending the merger of a pull request, the wal-e module fails to install due to Python versioning conflicts; the file in question is `roles/Stouts.wale/tasks/install.deb.yml` and the diff is [here](https://github.com/Stouts/Stouts.wale/pull/16/files?diff=split).
    * Due to changes in Ansible (I believe 2.x), the nginx role is also currently broken. Pending a pull request merger, the syntax in `roles/ANXS.nginx/tasks/sites.yml` is obsolete and needs patching; see [this PR](https://github.com/ANXS/nginx/pull/90) for more details.
* You may run into an nginx error on reloading nginx. If you do, log into the machine and run `systemctl start nginx`, then run the ansible playbook again.
* You may wish to configure ansible to [disable host checking](https://docs.ansible.com/ansible/intro_getting_started.html#host-key-checking) and [disable retry files](https://docs.ansible.com/ansible/intro_configuration.html#retry-files-enabled).

# Contributing

Pull requests are welcome! If you have changes to make the setup more robust, deploy easier to more machines, or otherwise improve the development or deployment of ODK Build, please don't hesitate to suggest them as issues or submit pull requests with the relevant changes.

# License

Build is licensed under the [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0) license.


ansible-galaxy install -r Rolefile.yml

