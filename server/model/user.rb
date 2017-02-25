# encoding: UTF-8

require 'json'

require './server/model/connection_manager'
require './server/lib/extensions'
require 'digest/sha1'

class User
  def self.find(username)
    data = User.table.filter( :username => username.to_s.downcase ).first

    return nil if data.nil?
    return (User.new data)
  end

  def self.find_by_email(email)
    data = User.table.filter( :email => email ).first

    return nil if data.nil?
    return (User.new data)
  end

  def self.find_by_login_or_email(x)
    # we perform two separate queries rather than formulate a new one to ensure
    # the username has precedence.
    return self.find(x) || self.find_by_email(x)
  end

  def self.find_by_id(id)
    data = User.table.filter( :id => id ).first

    return nil if data.nil?
    return (User.new data)
  end

# Class
  def self.create(data)
    username = data[:username].downcase
    pepper = Time.now.to_f.to_s

    begin
      User.table.insert({
        :email => data[:email],
        :username => username,
        :password => (User.hash_password data[:password], pepper),
        :pepper => pepper
      })
    rescue Sequel::DatabaseError
      return nil
    end

    return (User.find username)
  end

# Instance
  def data(summary = false)
    result = {
      :username => self.username,
      :display_name => self.username,
      :email => self.email
    }
    result[:forms] = self.forms.map{ |form| form.data(true) } unless summary
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
    return other.username == self.username
  end

  def log_login_audit!(as_user = nil)
    # TODO: see note in form.rb => Form#log-audit!
    Thread.new{ User.audit_table.insert({ :user_id => self.id, :timestamp => DateTime.now, :as_user => (as_user.nil? ? nil : as_user.id) }) }.join
  end

# Fields
  def id
    return @data[:id]
  end

  def email
    return @data[:email]
  end
  def email=(email)
    @data[:email] = email
  end

  def username
    return @data[:username]
  end

  def password
    return @data[:password]
  end
  def password=(plaintext)
    @data[:password] = (User.hash_password plaintext, @data[:pepper])
  end

  def forms
    Form.find_by_user(self)
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
  def initialize(data)
    @data = data
  end

  def self.hash_password(plaintext, pepper)
    return (Digest::SHA1.hexdigest "--[#{plaintext}]==[#{pepper}]--")
  end

  def self.table
    return ConnectionManager.db[:users]
  end

  def self.audit_table
    return ConnectionManager.db[:login_audit]
  end

  def row
    return User.table.filter( :username => self.username )
  end
end

