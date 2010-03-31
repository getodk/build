require 'rubygems'
require 'odkbuild_server'

# middleware
use Rack::CommonLogger
use Rack::Session::Cookie
use Warden::Manager do |manager|
  manager.default_strategies = :password
  manager.failure_app = OdkBuild
end

# app
run OdkBuild
