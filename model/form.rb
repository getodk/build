require 'model/connection_manager'

class String
  def self.random_chars( length )
    chars = ('a'..'z').to_a + ('A'..'Z').to_a + ('0'..'9').to_a
    return (0...length).map{ chars[Kernel.rand(chars.length)] }.join
  end
end

class Form
  def self.find(key, get_form_data = false)
    key = key.to_s

    data = ConnectionManager.connection[:forms][key]

    return nil if data.nil?

    if get_form_data
      form_data = ConnectionManager.connection[:form_data][key] || ''
      return (Form.new key, data, form_data)
    else
      return (Form.new key, data)
    end
  end

# Class
  def data
    result = @data.dup
    result[:controls] = JSON.parse(@form_data) unless @form_data.nil?

    return result
  end

  def self.create(data, owner)
    key = (String.random_chars 6) while !ConnectionManager.connection[:forms][key].nil?

    ConnectionManager.connection[:forms][key] = {
      :title => data[:title],
      :description => (data[:description] || ''),
      :owner => owner.username
    }

    return (User.find key)
  end

  def update(data)
    self.name = data[:title] if data[:title].present?
    self.description = data[:description] if data[:description].present?
    @form_data = data[:controls].to_json if data[:controls].present?
  end

  def delete!
    ConnectionManager.connection[:forms][@key] = nil
    ConnectionManager.connection[:form_data][@key] = nil
  end

  def save
    ConnectionManager.connection[:forms][@key] = @data
    ConnectionManager.connection[:forms][@key] = @form_data unless @form_data.nil?
  end

  def ==(other)
    return false unless other.is_a? Form
    return other.id == @key
  end

# Fields
  def id
    return @key
  end

  def title
    return @data['title']
  end
  def title=(title)
    @data['title'] = title
  end

  def description
    return @data['description']
  end
  def description=(description)
    @data['description'] = description
  end

  def owner
    return User.find @data['owner']
  end

  def form_data
    return @form_data
  end
  def form_data=(form_data)
    @form_data = form_data
  end

private
  def initialize(key, data, form_data = nil)
    @key, @data = key, data
    @form_data = form_data unless form_data.nil?
  end
end