class ConfigManager
  def self.[](config_key)
    return @@config[config_key]
  end

  def self.load
    @@config = (YAML.load_file('config.yml') || {})[ENV['RACK_ENV']]

    throw Exception.new "No valid RACK_ENV supplied for your config! I see: #{ENV['RACK_ENV']}" if @@config.nil?
  end
end

