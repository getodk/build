# encoding: UTF-8

require 'tokyo_tyrant'

class ConnectionManager
  class << self
    attr_accessor :connection
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
    self.class.connection ||= begin
      add_finalizer_hook!
      {
        # permanent stores
        :users => open_connection(:users),
        :forms => open_connection(:forms),
        :form_data => open_connection(:form_data),

        # temporary stores
        :aggregate_requests => open_connection(:aggregate_requests)
      }
    end
  end

  def open_connection(db_name)
    TokyoTyrant.const_get(ConfigManager['database'][db_name.to_s]['type']).new(
      ConfigManager['database'][db_name.to_s]['host'],
      ConfigManager['database'][db_name.to_s]['port'])
  end

  def add_finalizer_hook!
    at_exit do
      begin
        self.class.connection.each_value{ |connection| connection.close }
      rescue Exception => e
        puts "Error closing Tokyo Cabinet connection. You might have to clean up manually."
      end
    end
  end

  # Returns a handle to ConnectionManager's databases.
  # This is called from the Rakefile to create a fake Rack instance
  # and returns the connection object.
  def self.rackless_connection
    app = FakeRack.new
    ConnectionManager.new(app).call({})
    return ConnectionManager.connection
  end
end

class FakeRack; def call(env); end end

