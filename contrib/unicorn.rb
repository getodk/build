worker_processes 4

working_directory "/srv/odkbuild/current"

stderr_path "/var/log/odkbuild/stderr.log"
stdout_path "/var/log/odkbuild/stdout.log"

listen "/var/odkbuild/build-server.sock", :backlog => 64
listen 9393, :tcp_nopush => true
pid "/var/odkbuild/build-server.pid"

preload_app true
