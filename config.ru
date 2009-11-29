require 'rubygems'
require 'cloudkit'
require 'rufus/tokyo'
require 'odkmaker_server.rb'

# config
CloudKit.setup_storage_adapter Rufus::Tokyo::Table.new 'odkmaker.tdb'

# middleware
use Rack::CommonLogger
use Rack::Session::Pool
use CloudKit::OpenIDFilter do |url|
  (url =~ /^\/(|images|javascripts|stylesheets)/) != nil
end

# apps
use CloudKit::Service, :collections => [:forms]
run Sinatra::Application