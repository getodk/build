require 'lib/multipart'

require 'model/user'
require 'model/form'
require 'model/connection_manager'

class OdkBuild < Sinatra::Application
  disable :run
  set :views, File.dirname(__FILE__) + '/views' # required for dev env

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

  # Util methods

  # bounce a payload off the server to trigger a download
  post '/download' do
    content_type :xml
    attachment params[:filename]
    return params[:payload]
  end

  # bounce a payload through the server to aggregate
  post '/aggregate/post' do
    # make sure we're good to go
    user = env['warden'].user
    return error_permission_denied unless user
    return error_validation_failed unless params[:payload]

    # generate some local ids
    local_token = "#{Time.now.to_i}_#{user.username}"
    oauth_callback = "http://#{request.host_with_port}/aggregate/return/#{local_token}"

    # oauth
    instance_uri = "https://#{params[:aggregate_instance_name]}.appspot.com"
    consumer = get_oauth_consumer instance_uri
    request_token = consumer.get_request_token :oauth_callback => oauth_callback

    # store off stuff we'll need later
    ConnectionManager.connection[:aggregate_requests][local_token] = {
      'site' => instance_uri,
      'instance_name' => params[:aggregate_instance_name],
      'token' => request_token.token,
      'secret' => request_token.secret,
      'payload' => params[:payload]
    }

    # send the user to the right place
    redirect request_token.authorize_url :oauth_callback => oauth_callback
  end

  get '/aggregate/return/:local_token' do
    # get our info back
    aggregate_request = ConnectionManager.connection[:aggregate_requests][params[:local_token]]

    # oauth
    consumer = get_oauth_consumer aggregate_request['site']
    request_token = OAuth::RequestToken.new consumer, aggregate_request['token'], aggregate_request['secret']
    access_token = request_token.get_access_token :oauth_verifier => params[:oauth_verifier]

    # fire off our request
    body, headers = Multipart::Post.prepare_query 'form_def_file' => { :filename => 'form.xml', :content => aggregate_request['payload'] }
    result = access_token.post '/upload?auth=oauth', body, headers

    # look at the bloody remains
    unless (result.is_a? Net::HTTPSuccess) || (result.is_a? Net::HTTPFound) # aggregate is really weird.
      # something went wrong
      status 400
      return { :error => 'Something went wrong when trying to post to Aggregate.' }.to_json
    end

    content_type :html
    @aggregate_instance_uri = aggregate_request['site']
    erb :aggregate_success
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

  def get_oauth_consumer(site)
    OAuth::Consumer.new 'anonymous', 'anonymous',
      { :site => site,
        :request_token_path => '/_ah/OAuthGetRequestToken',
        :authorize_path => '/_ah/OAuthAuthorizeToken',
        :access_token_path => '/_ah/OAuthGetAccessToken' }
  end

end
