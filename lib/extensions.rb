
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
end

