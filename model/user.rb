# encoding: UTF-8

require 'json'

require './model/connection_manager'
require './lib/extensions'
require 'digest/sha1'

class User
  def self.find(key)
    key = key.to_s.downcase

    data = User.table.filter( :username => key ).first

    return nil if data.nil?
    return (User.new key, data)
  end

  def self.find_by_email(email)
    data = User.table.filter( :email => email ).first

    return nil if data.nil?
    return (User.new key, data)
  end

# Class
  def self.create(data)
    key = data[:username].downcase
    pepper = Time.now.to_f.to_s

    begin
      User.table.insert({
        :email => data[:email],
        :username => key,
        :password => (User.hash_password data[:password], pepper),
        :pepper => pepper
      })
    rescue Sequel::DatabaseError
      return nil
    end

    return (User.find key)
  end

# Instance
  def data
    result = {
      :username => self.username,
      :display_name => self.username,
      :email => self.email,
      :forms => (self.forms true).map{ |form| form.data true }
    }

    return result
  end

  def update(data)
    self.email = data[:email] unless data[:email].nil?
    self.password = data[:password] unless data[:password].nil? || data[:password] == ""
  end

  def delete!
    row.delete
  end

  def save
    row.update(@data)
  end

  def ==(other)
    return false unless other.is_a? User
    return other.username == @key
  end

# Fields
  def email
    return @data[:email]
  end
  def email=(email)
    @data[:email] = email
  end

  def username
    return @key
  end

  def password
    return @data[:password]
  end
  def password=(plaintext)
    @data[:password] = (User.hash_password plaintext, @data[:pepper])
  end

  def forms(get_form_data = false)
    Form.find_by_user(self, get_form_data)
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

  def id
    return @data[:id]
  end

  def self.hash_password(plaintext, pepper)
    return (Digest::SHA1.hexdigest "--[#{plaintext}]==[#{pepper}]--")
  end

  def self.table
    return ConnectionManager.db[:users]
  end

  def row
    return User.table.filter( :username => @key )
  end
end

