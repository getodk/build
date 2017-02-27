require 'yaml'
require 'deep_merge'

LOCAL_CONFIG_PATH = File.join(File.dirname(__FILE__), '..', 'config.yml')
GLOBAL_CONFIG_PATH = '/etc/odkbuild/config.yml'

class ConfigManager
  def self.[](config_key)
    return @@config[config_key]
  end

  def self.load
    env = ENV['RACK_ENV'] || 'development'
    @@config = File.exist?(LOCAL_CONFIG_PATH) ? (::YAML.load_file('config.yml'))[env] : {}
    @@config.deep_merge!(::YAML.load_file(GLOBAL_CONFIG_PATH)[env]) if File.exist?(GLOBAL_CONFIG_PATH)

    STDERR.write "WARNING: using development env because no RACK_ENV was supplied.\n" unless ENV['RACK_ENV']
    throw Exception.new "No valid RACK_ENV supplied for your config! I see: #{ENV['RACK_ENV']}" if @@config.nil?
  end
end

