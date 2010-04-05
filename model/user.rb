require 'rufus/tokyo'
require 'digest/sha1'

class User < Model
  user_table = Rufus::Tokyo::Table.new 'users.tdb'

  def self.find(key)
    key = key.to_s.downcase
    data = user_table[key]

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
    key = data[:username].downcase
    pepper = Time.now.to_f.to_s

    user_table[key] = {
      :display_name => data[:username],
      :email => data[:email],
      :pepper => pepper,
      :password => (User.hash_password data[:password]),
      :forms => nil
    }

    return (User.find key)
  end

  def update(data)
    self.email = data[:email] if data[:email].present?
    self.password = data[:password] if data[:password].present?
  end

  def delete!
    user_table[@key] = nil
  end

  def save
    user_table[key] = @data
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
    @data['password'] = (User.hash_password plaintext)
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

  def forms.<<(form)
    if @data['forms'].nil?
      @data['forms'] = form.id
    elsif !((@data['forms'].split ',').include? form.id)
      @data['forms'] += ",#{form.id}"
    end
  end

# Other
  def authenticate?(plaintext)
    return ((User.hash_password plaintext) == self.password)
  end

private
  def initialize(key, data)
    @key, @data = key, data
  end

  def self.hash_password(plaintext)
    return (Digest::Sha1.hexdigest "--[#{plaintext}]==[#{self['pepper']}]--")
  end
end