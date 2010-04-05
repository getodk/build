require 'rufus/tokyo'
require 'digest/sha1'

class User
  def self.find(key)
    user_table = Rufus::Tokyo::Table.new 'users.tdb'

    key = key.to_s.downcase
    data = user_table[key]

    user_table.close

    return nil if data.nil?
    return (User.new key, data)
  end

# Class
  def data
    return {
      :display_name => self.display_name,
      :email => self.email,
      :forms => self.forms
    }
  end

  def self.create(data)
    user_table = Rufus::Tokyo::Table.new 'users.tdb'

    key = data[:username].downcase
    pepper = Time.now.to_f.to_s

    user_table[key] = {
      :display_name => data[:username],
      :email => data[:email],
      :pepper => pepper,
      :password => (User.hash_password data[:password], pepper),
      :forms => nil
    }
    user_table.close

    return (User.find key)
  end

  def update(data)
    self.email = data[:email] if data[:email].present?
    self.password = data[:password] if data[:password].present?
  end

  def delete!
    user_table = Rufus::Tokyo::Table.new 'users.tdb'
    user_table[@key] = nil
    user_table.close
  end

  def save
    user_table = Rufus::Tokyo::Table.new 'users.tdb'
    user_table[key] = @data
    user_table.close
  end

  def ==(other)
    return false unless other.is_a? User
    return other.display_name == self.display_name
  end

# Fields
  def display_name
    return @data['display_name']
  end

  def password
    return @data['password']
  end

  def password=(plaintext)
    @data['password'] = (User.hash_password plaintext, @data['pepper'])
  end

  def email
    return @data['email']
  end

  def email=(value)
    @data['email'] = value
  end

  def forms
    return [] if @data['forms'].nil?
    return (@data['forms'].split ',').map{ |form_id| Form.find(form_id, false) }
  end

  def add_form(form)
    if @data['forms'].nil?
      @data['forms'] = form.id
    elsif !((@data['forms'].split ',').include? form.id)
      @data['forms'] += ",#{form.id}"
    end
  end

# Other
  def authenticate?(plaintext)
    return ((User.hash_password plaintext, @data['pepper']) == self.password)
  end

private
  def initialize(key, data)
    @key, @data = key, data
  end

  def self.hash_password(plaintext, pepper)
    return (Digest::SHA1.hexdigest "--[#{plaintext}]==[#{pepper}]--")
  end
end