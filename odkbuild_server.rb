require 'rubygems'
gem 'sinatra','<1.0'
require 'sinatra'
require 'json'
require 'pony'
require 'warden_odkbuild'
require 'model/user'
require 'model/form'

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
    return error_validation_failed if [:username, :password, :email].
                                      any?{ |key| !(params.has_key? key.to_s) }
    return error_validation_failed if User.find params[:username]

    user = User.create params
    env['warden'].authenticate(:odkbuild)

    return user.data.to_json
  end

  # non-RESTful (auth): gets authenticated user
  get '/user' do
    user = env['warden'].user

    return error_permission_denied if user.nil?
    return user.data.to_json
  end

  get '/user/:username' do
    user = User.find params[:username]

    return error_not_found if user.nil?
    return user.data.to_json
  end

  put '/user/:username' do
    user = env['warden'].user
    return error_permission_denied unless user.username == params[:username]
    return error_validation_failed if params[:password].nil? and
                                    !(user.authenticate? params[:old_password])

    user.update params
    user.save

    return user.data.to_json
  end

  delete '/user/:username' do
    user = env['warden'].user
    return error_permission_denied unless user.username == params[:username]

    user.delete!
    return { :success => 'true' }.to_json
  end

  # Forms
  get '/forms' do
    user = env['warden'].user

    return error_permission_denied if user.nil?
    return user.forms.to_json
  end

  # only takes JSON!
  post '/forms' do
    user = env['warden'].user

    # pull JSON data out
    request_data = JSON.parse(request.body.read.to_s)

    # validate input
    return error_validation_failed if request_data['title'].nil?

    form = Form.create request_data, user
    user.add_form form
    user.save
    return form.data.to_json
  end

  get '/form/:form_id' do
    user = env['warden'].user

    form = Form.find(params[:form_id], true)

    return error_not_found if form.nil?
    return error_permission_denied if form.owner != user
    return form.data.to_json
  end

  # only takes JSON!
  put '/form/:form_id' do
    user = env['warden'].user

    # pull JSON data out
    request_data = JSON.parse(request.body.read.to_s)

    form = Form.find(params[:form_id], true)

    return error_not_found if form.nil?
    return error_permission_denied if form.owner != user

    form.update request_data
    form.save

    return form.data.to_json
  end

  delete '/form/:form_id' do
    user = env['warden'].user

    form = Form.find(params[:form_id], true)

    return error_not_found if form.nil?
    return error_permission_denied if form.owner != user

    form.delete!
    return { :success => 'true' }.to_json
  end

  # Auth methods
  post '/login' do
    env['warden'].authenticate(:odkbuild)
    if env['warden'].authenticated?
      return env['warden'].user.data.to_json
    else
      return error_permission_denied
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

  post '/reset_password' do
    user = User.find params[:username]
    new_password = user.reset_password!
    user.save

    (Pony.mail :to => user.email, :from => 'support@opendatakit.org',
               :subject => 'Your new ODK Build password.',
               :body => "Your ODK Build password has been reset. The new password is #{new_password}.\n\nThanks,\nThe ODK Build Team")

    return { :success => 'true' }.to_json
  end

private
  def error_validation_failed
    status 400
    return { :error => 'validation failed' }.to_json
  end

  def error_permission_denied
    status 401
    return { :error => 'permission denied' }.to_json
  end

  def error_not_found
    status 404
    return { :error => 'not found' }.to_json
  end

end
