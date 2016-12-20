class AssetManager
  def self.javascripts
    return @@assets['javascripts'] || []
  end

  def self.build_time
    return @@build_time
  end

  def self.build_rev
    return @@build_rev
  end

  def self.load
    @@assets = YAML.load_file('assets.yml') || {}
    begin
      @@build_rev = File.read '.build_rev'
    rescue Errno::ENOENT
      @@build_rev = 'an unknown revision'
    end
    begin
      @@build_time = File.read '.build_time'
    rescue Errno::ENOENT
      @@build_time = Time.new.to_i.to_s
    end
  end
end

