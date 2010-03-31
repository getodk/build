require 'rubygems'
require 'sinatra'
require 'json'
require 'rufus/tokyo'
require 'warden'

tokyo_data = Rufus::Tokyo::Table.new 'odkmaker.tdb'

Warden::Strategies.add(:password) do
  def valid?
    params[:username] || params[:password]
  end

  def authenticate!
    
  end
end

class OdkBuild

  before do
    content_type :json
  end

  # For dev server purposes, load index via Sinatra. Eventually, just do it
  # with Apache.
  get '/' do
    content_type :json
    erb :index
  end

  # Simple RESTful service follows

  # Users
  get '/users' do
    # return 403
  end

  post '/users' do
    # create new user
  end

  get '/user/:user_id' do
    # return user for given id
  end

  put '/user/:user_id' do
    # update user for given id
  end

  delete '/user/:user_id' do
    # delete user for given id
  end

  # Forms
  get '/forms' do
    # return form summaries for authenticated user
  end

  post '/forms' do
    # save new form for authenticated user
    # (check for name)
  end

  get '/form/:form_id' do
    # return form for authenticated user
  end

  put '/form/:form_id' do
    # update form for authenticated user
  end

  delete '/form/:form_id' do
    # delete form for authenticated user
  end

  # Auth methods

  post '/login' do
    if env['warden'].authenticated?(:password)
      return {:user => env['warden'].user}.to_json
    else
      return {:user => 'none'}.to_json
    end
  end

  get '/logout'

end
