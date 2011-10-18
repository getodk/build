
class Object
  def blank?
    respond_to?(:empty?) ? empty? : !self
  end
end

class String
  def self.random_chars length
    chars = ('a'..'z').to_a + ('A'..'Z').to_a + ('0'..'9').to_a
    return (0...length).map{ chars[Kernel.rand(chars.length)] }.join
  end
end

class Hash
  def force_encoding! encoding='ISO-8859-1'
    self.each_value{ |value| value.force_encoding encoding if value.is_a? String }
    return self
  end

  def symbolize_keys!
    # from activesupport
    keys.each{ |key| self[(key.to_sym rescue key) || key] = delete(key) }
  end

  def deep_symbolize_keys!
    self.symbolize_keys!
    self.values.select{ |value| value.is_a? Hash }.each{ |hash| hash.deep_symbolize_keys! }
  end
end

