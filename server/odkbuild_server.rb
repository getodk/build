# encoding: UTF-8

require 'sinatra'
require 'json'

require 'pony'

require 'date'
require 'uri'
require 'net/https'
require 'net/http/digest_auth'
require './server/lib/multipart'

require './server/model/user'
require './server/model/form'
require './server/model/connection_manager'

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
    user.log_login_audit!
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
    request_data = JSON.parse request.body.read.to_s
    request_data.deep_symbolize_keys!

    # validate input
    return error_validation_failed if request_data[:title].blank?
    return error_validation_failed if request_data[:controls].nil?
    return error_validation_failed if request_data[:metadata].blank?

    form = (Form.create request_data, user)
    return form.data.to_json
  end

  get '/form/:form_id' do
    user = env['warden'].user

    form = Form.find(params[:form_id])

    return error_not_found if form.nil?
    return error_permission_denied if form.owner != user
    return form.data.to_json
  end

  # only takes JSON!
  put '/form/:form_id' do
    user = env['warden'].user

    # pull JSON data out
    request_data = JSON.parse request.body.read.to_s
    request_data.deep_symbolize_keys!

    form = Form.find(params[:form_id])

    return error_not_found if form.nil?
    return error_permission_denied if form.owner != user

    form.update request_data
    form.save

    return form.data.to_json
  end

  delete '/form/:form_id' do
    user = env['warden'].user

    form = Form.find(params[:form_id])

    return error_not_found if form.nil?
    return error_permission_denied if form.owner != user

    form.delete!
    return { :success => 'true' }.to_json
  end

  # Auth methods
  post '/login' do
    env['warden'].authenticate(:odkbuild)
    if env['warden'].authenticated?
      if env['spoofer']
        env['spoofer'].log_login_audit!(env['warden'].user)
      else
        env['warden'].user.log_login_audit!
      end

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
    user = User.find_by_login_or_email params[:username]
    return error_not_found if user.nil?

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

  # bounce a payload off the server and serialize it for native download
  post '/binary/save' do
    content_type 'application/octet-stream'
    attachment params[:filename]
    return params[:payload]
  end

  # bounce a file off the server and deserialize it for native upload
  post '/binary/load' do
    # read up whatever file we got, dump it right back to client

    result = nil
    begin
      # first try ruby unmarshal.
      result = (Marshal.load params[:file][:tempfile]).to_json
    rescue
      # otherwise just return as-is.
      params[:file][:tempfile].rewind
      result = params[:file][:tempfile]
    end

    return result
  end

  # bounce a payload through to a local build2xlsform instance for dev env. in prod, this ought
  # to be done at the apache/nginx/etc level via proxypass.
  post '/convert' do
    http = Net::HTTP.new('localhost', 8686)
    req = Net::HTTP::Post.new('/convert')
    req['Content-Type'] = 'application/json'
    req.body = request.body.read.to_s

    res = http.request(req)

    status 200
    return res.body
  end

  # bounce a payload through the server to aggregate
  post '/aggregate/post' do
    # make sure we're good to go
    user = env['warden'].user
    return error_permission_denied unless user
    return error_validation_failed unless params[:target]
    return error_validation_failed unless params[:payload]
    return error_validation_failed unless params[:name]
    return error_validation_failed unless params[:credentials][:user]
    return error_validation_failed unless params[:credentials][:password]

    protocol = params[:protocol] || 'https'
    uri = URI.parse("#{protocol}://#{params[:target]}/formUpload")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = protocol == 'https'
    req = Net::HTTP::Post.new(uri.request_uri)

    body, headers = Multipart::Post.prepare_query({ 'form_name' => params[:name], 'form_def_file' => { :filename => 'form.xml', :content => params[:payload] } })
    req.body = body
    headers.each{ |k, v| req[k] = v }

    req['X-OpenRosa-Version'] = '1.0'
    req['Date'] = DateTime.now.httpdate

    begin
      res = http.request(req)
    rescue SocketError => ex
      status 404
      return { :error => ex.message, :code => 404, :body => 'Socket Error' }.to_json
    rescue Errno::ECONNREFUSED => ex
      status 400
      return { :error => 'Errno::ECONNREFUSED', :code => 'ECONNREFUSED', :body => 'Connection refused' }.to_json
    end

    if res.code.to_s == '401'
      # we failed without auth; retry with digest auth now that we have details.
      uri.user = params[:credentials][:user]
      uri.password = params[:credentials][:password]
      auth = Net::HTTP::DigestAuth.new.auth_header uri, res['www-authenticate'], 'POST'
      req.add_field 'Authorization', auth
      res = http.request(req)

      if res.code.to_s == '401'
        return error_permission_denied
      elsif (res.code.to_s =~ /^2/).nil?
        status 400
        return { :error => res.message, :code => res.code, :body => res.body }.to_json
      end
    elsif (res.code.to_s =~ /^2/).nil?
      status 400
      return { :error => res.message, :code => res.code, :body => res.body }.to_json
    end

    status 200
    return { :success => true }.to_json
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

