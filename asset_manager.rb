class AssetManager
  def self.javascripts
    return @@assets['javascripts'] || []
  end

  def self.build_time
    return @@build_time
  end

  def self.load
    @@assets = YAML.load_file('assets.yml') || {}
    @@build_time = File.read '.build_time'
  end
end

