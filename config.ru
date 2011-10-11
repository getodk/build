require 'rubygems'
require 'bundler/setup'

require 'rack'

require './warden_odkbuild'

require './model/connection_manager'
require './config_manager'
require './asset_manager'

require './odkbuild_server'

# load configuration files
ConfigManager.load
AssetManager.load

# middleware
use Rack::CommonLogger

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

# app
run OdkBuild

