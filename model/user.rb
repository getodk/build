# encoding: UTF-8

require 'json'

require './model/connection_manager'
require './lib/extensions'
require 'digest/sha1'

class User
  def self.find(key)
    key = key.to_s.downcase

    data = ConnectionManager.connection[:users][key]

    return nil if data.blank?
    return (User.new key, (Marshal.load data))
  end

# Class
  def data
    result = {
      :username => @key,
      :display_name => self.display_name,
      :email => self.email,
      :forms => (self.forms true).map{ |form| form.data }
    }

    return result
  end

  def self.create(data)
    key = data[:username].downcase
    pepper = Time.now.to_f.to_s

    ConnectionManager.connection[:users][key] = Marshal.dump({
      :display_name => data[:username],
      :email => data[:email],
      :pepper => pepper,
      :password => (User.hash_password data[:password], pepper),
      :forms => []
    })

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
    ConnectionManager.connection[:users][@key] = Marshal.dump @data
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
    return @data[:display_name]
  end

  def password
    return @data[:password]
  end
  def password=(plaintext)
    @data[:password] = (User.hash_password plaintext, @data[:pepper])
  end

  def email
    return @data[:email]
  end
  def email=(email)
    @data[:email] = email
  end

  def forms(get_form_data = false)
    return [] if @data[:forms].nil?

    return @data[:forms] unless get_form_data

    return @forms if defined? @forms
    @forms = @data[:forms].map{ |id| Form.find id }
  end
  def add_form(form)
    @data[:forms] ||= []
    @data[:forms].push form.id
  end
  def remove_form(form)
    return if @data[:forms].nil?
    @data[:forms].delete form.id
  end

  def is_admin?
    return @data[:admin] || false
  end
  def admin=(is_admin)
    @data[:admin] = is_admin
  end

# Other
  def authenticate?(plaintext)
    return ((User.hash_password plaintext, @data[:pepper]) == self.password)
  end

  def reset_password!
    new_password = (String.random_chars 10)
    self.password = new_password
    return new_password
  end

private
  def initialize(key, data)
    @key, @data = key, data
  end

  def self.hash_password(plaintext, pepper)
    return (Digest::SHA1.hexdigest "--[#{plaintext}]==[#{pepper}]--")
  end
end

