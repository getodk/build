# encoding: UTF-8

require 'sequel'

class ConnectionManager
  class << self
    attr_accessor :db
  end

  def initialize(app)
    @app = app
  end

  def call(env)
    open_connections_if_necessary!
    @app.call(env)
  end

  protected

  def open_connections_if_necessary!
    self.class.db ||= begin
      add_finalizer_hook!
      Sequel.connect(
        :adapter => 'postgres',
        :host => ConfigManager['database']['host'],
        :database => ConfigManager['database']['database'],
        :user => ConfigManager['database']['user'],
        :password => ConfigManager['database']['password']
      )
    end
  end

  def add_finalizer_hook!
    at_exit do
      begin
        self.class.db.disconnect
      rescue Exception => e
        puts "Error closing Postgres connection. Some minor data loss may have occurred for in-flight transactions."
      end
    end
  end

  # Returns a handle to ConnectionManager's databases.
  # This is called from the Rakefile to create a fake Rack instance
  # and returns the connection object.
  def self.rackless_connection
    app = FakeRack.new
    ConnectionManager.new(app).call({})
    return ConnectionManager.db
  end
end

class FakeRack; def call(env); end end

