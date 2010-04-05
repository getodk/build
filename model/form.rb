require 'rufus/tokyo'

class String
  def self.random_chars( length )
    chars = ('a'..'z').to_a + ('A'..'Z').to_a + ('0'..'9').to_a
    return (0...length).map{ chars[Kernel.rand(chars.length)] }.join
  end
end

class Form
  def self.find(key, get_form_data = false)
    key = key.to_s

    form_table = Rufus::Tokyo::Table.new 'forms.tdb'
    data = form_table[key]
    form_table.close

    return nil if data.nil?

    if get_form_data
      form_data_table = Rufus::Tokyo::Cabinet.new 'form_data.tch'
      form_data = form_data[key] || ''
      form_data.close

      return (Form.new key, data, form_data)
    else
      return (Form.new key, data)
    end
  end

# Class
  def data
    result = @data.dup
    result[:owner] = (User.find result[:owner]).data
    result[:controls] = JSON.parse(@form_data) unless @form_data.nil?

    return result
  end

  def self.create(data, owner)
    form_table = Rufus::Tokyo::Table.new 'forms.tdb'

    key = (String.random_chars 5) while !form_table[key].nil?

    form_table[key] = {
      :title => data[:title],
      :description => (data[:description] || ''),
      :owner => owner.username
    }
    form_table.close

    return (User.find key)
  end

  def update(data)
    self.name = data[:title] if data[:title].present?
    self.description = data[:description] if data[:description].present?
    @form_data = data[:controls].to_json if data[:controls].present?
  end

  def delete!
    form_table = Rufus::Tokyo::Table.new 'forms.tdb'
    form_table[@key] = nil
    form_table.close

    form_data_table = Rufus::Tokyo::Cabinet.new 'form_data.tch'
    form_data[@key] = nil
    form_data.close
  end

  def save
    form_table = Rufus::Tokyo::Table.new 'forms.tdb'
    form_table[key] = @data
    form_table.close

    unless @form_data.nil?
      form_data_table = Rufus::Tokyo::Cabinet.new 'form_data.tch'
      form_data[@key] = @form_data
      form_data.close
    end
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