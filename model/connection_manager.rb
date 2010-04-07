require 'rufus/tokyo'

class ConnectionManager
  class << self
    attr_accessor :connection
  end

  def initialize(app)
    @app = app
  end

  def call(env)
    open_connection_if_necessary!
    @app.call(env)
  end

  protected

  def open_connection_if_necessary!
    self.class.connection ||= begin
      add_finalizer_hook!
      {
        :users => (Rufus::Tokyo::Table.new 'users.tdb'),
        :forms => (Rufus::Tokyo::Table.new 'forms.tdb'),
        :form_data => (Rufus::Tokyo::Cabinet.new 'form_data.tch')
      }
    end
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
end