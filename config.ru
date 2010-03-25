require 'rubygems'
require 'odkmaker_server.rb'

# middleware
use Rack::CommonLogger
use Rack::Session::Pool

# apps
run Sinatra::Application
