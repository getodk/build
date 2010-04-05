require 'rubygems'
require 'warden'
require 'model/user'

Warden::Manager.serialize_into_session { |user| user.nil? ? nil : user[:pk] }
Warden::Manager.serialize_from_session { |id| id.nil? ? nil : user_table[id] }

Warden::Strategies.add(:odkbuild) do
  def valid?
    params[:username] || params[:password]
  end

  def authenticate!
    user = User.find params[:username]

    if user.nil? or !(user.authenticate? params[:password])
      fail! "authentication failed"
    else
      success! user
    end
  end
end