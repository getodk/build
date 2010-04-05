require 'odkbuild_server'

# middleware
use Rack::CommonLogger

use Rack::Session::Cookie,
  :secret => 'configure_me'

use Warden::Manager do |manager|
  manager.default_strategies :odkbuild
  manager.failure_app = OdkBuild
end

# app
run OdkBuild