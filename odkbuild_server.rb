require 'rubygems'
require 'sinatra'
require 'json'
require 'warden_odkbuild'
require 'model/user'

class OdkBuild < Sinatra::Default
  disable :run

  before do
    content_type :json
  end

  # For dev server purposes, load index via Sinatra. Eventually, just do it
  # with Apache.
  get '/' do
    content_type :html
    erb :index
  end

  # Simple RESTful service follows

  # Users
  get '/users' do
    status 403
    return { :error => 'forbidden' }.to_json
  end

  post '/users' do
    # validate input
    if [:username, :password, :email].any?{ |key| !(params.has_key? key.to_s) }
      status 400
      return { :error => 'validation failed' }.to_json
    end

    # validate dupe
    if User.find params[:username]
      status 400
      return { :error => 'duplicate username' }.to_json
    end

    return (User.create params).data.to_json
  end

  get '/user/:username' do
    return (User.find params[:username]).data.to_json
  end

  put '/user/:username' do
    user = env['warden'].user
    unless user.username == params[:username]
      status 401
      return { :error => 'permission denied' }.to_json
    end

    if params[:password].present? and !(user.authenticate? params[:old_password])
      status 400
      return { :error => 'validation failed' }
    end

    user.update params
    user.save

    return user.data.to_json
  end

  delete '/user/:username' do
    user = env['warden'].user
    unless user.username == params[:username]
      status 401
      return { :error => 'permission denied' }.to_json
    end

    user.delete!
    return { :success => 'true' }.to_json
  end

  # Forms
  get '/forms' do
    return { env['warden'].user.forms }.to_json
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
      return { :user => env['warden'].user }.to_json
    else
      return { :user => 'none' }.to_json
    end
  end

  get '/logout' do
    env['warden'].logout
    return { :user => 'none' }.to_json
  end

  get '/unauthenticated' do
    status 401
    return { :error => 'unauthenticated' }.to_json
  end

end
