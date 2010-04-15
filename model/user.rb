require 'model/connection_manager'
require 'digest/sha1'

class User
  def self.find(key)
    key = key.to_s.downcase

    data = ConnectionManager.connection[:users][key]

    return nil if data.nil?
    return (User.new key, data)
  end

# Class
  def data
    return {
      :username => @key,
      :display_name => self.display_name,
      :email => self.email,
      :forms => self.forms.map{ |form| form.data }
    }
  end

  def self.create(data)
    key = data[:username].downcase
    pepper = Time.now.to_f.to_s

    ConnectionManager.connection[:users][key] = {
      :display_name => data[:username],
      :email => data[:email],
      :pepper => pepper,
      :password => (User.hash_password data[:password], pepper),
      :forms => nil
    }

    return (User.find key)
  end

  def update(data)
    self.email = data[:email] unless data[:email].nil?
    self.password = data[:password] unless data[:password].nil?
  end

  def delete!
    ConnectionManager.connection[:users][@key] = nil
  end

  def save
    ConnectionManager.connection[:users][@key] = @data
  end

  def ==(other)
    return false unless other.is_a? User
    return other.username == @key
  end

# Fields
  def username
    return @key
  end

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
  def email=(email)
    @data['email'] = email
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