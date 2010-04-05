require 'odkbuild_server'

# middleware
use Rack::CommonLogger

use Rack::Session::Cookie,
  :secret => 'lr3mp3egv4vrq1r4'

use Warden::Manager do |manager|
  manager.default_strategies = :odkbuild
  manager.failure_app = OdkBuild
end

# app
run OdkBuild