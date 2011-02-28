class AssetManager
  def self.javascripts
    return @@assets['javascripts'] || []
  end

  def self.build_time
    return @@build_time
  end

  def self.load
    @@assets = YAML.load_file('assets.yml') || {}
    begin
      @@build_time = File.read '.build_time'
    rescue Errno::ENOENT
      @@build_time = Time.new.to_i.to_s
    end
  end
end

