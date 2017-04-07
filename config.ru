require 'rubygems'
require 'bundler/setup'

require 'rack'

require './server/tls_odkbuild'
require './server/warden_odkbuild'

require './server/model/connection_manager'
require './server/config_manager'
require './server/asset_manager'

require './server/odkbuild_server'

# load configuration files
ConfigManager.load
AssetManager.load

# middleware
use Rack::CommonLogger

if ConfigManager['cookie_ssl_only']
  use Build::TLS
end

use Rack::Session::Cookie,
  :secret => ConfigManager['cookie_secret']

use ConnectionManager

use Warden::Manager do |manager|
  manager.default_strategies :odkbuild
  manager.failure_app = OdkBuild
  manager.serialize_into_session do |user|
    user.nil? ? nil : user.username
  end
  manager.serialize_from_session do |id|
    id.nil? ? nil : (User.find id)
  end
end

use Rack::Static, :urls => [ '/stylesheets', '/javascripts', '/images' ], :root => 'public'

# app
run OdkBuild

