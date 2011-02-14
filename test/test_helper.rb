require "rubygems"
require "sinatra"
require "rack/test"
require "riot"
require "mocha"
require "json"
require "rake"

require "warden"
require "warden_odkbuild"

require 'model/connection_manager'
require "model/user.rb"
require "model/form.rb"

require 'config_manager'
require "odkbuild_server"

ENV['RACK_ENV'] = "test"
ConfigManager.load

use Rack::Session::Cookie,
  :secret => ConfigManager['cookie_secret']

use ConnectionManager
ConnectionManager.stubs(:connection).returns( { :users => {}, :forms => {}, :form_data => {} })

use Warden::Manager do |manager|
  manager.default_strategies :odkbuild
  manager.failure_app = OdkBuild
end

class Riot::Situation
  include Rack::Test::Methods
  def app; @app; end
end

def swallow_output(&block)
  output = StringIO.new
  $stdout = output
  block.call
  $stdout = STDOUT
  output.string
end

