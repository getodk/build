class ConfigManager
  def self.[](config_key)
    return @@config[config_key]
  end

  def self.load
    @@config = (YAML.load_file("config.yml") || {})[ENV['RACK_ENV']]
  end
end

