require 'warden'
require 'model/user'

Warden::Manager.before_failure do |env, opts|
  # Sinatra is very sensitive to the request method
  # since authentication could fail on any type of method, we need
  # to set it for the failure app so it is routed to the correct block
  env['REQUEST_METHOD'] = "GET"
end

use Warden::Manager do |manager|
  manager.serialize_into_session do |user|
    user.nil? ? nil : user.username
  end
  manager.serialize_from_session do |id|
    id.nil? ? nil : user_table[id]
  end
end

Warden::Strategies.add(:odkbuild) do
  def valid?
    return params['username'] && params['password']
  end

  def authenticate!
    user = User.find params['username']

    if user.nil? or !(user.authenticate? params['password'])
      fail! "authentication failed"
    else
      success! user
    end
  end
end