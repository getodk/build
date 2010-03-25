require 'rubygems'
require 'sinatra'
require 'json'
require 'rufus/tokyo'

# Rufus::Tokyo::Table.new 'odkmaker.tdb'

# For dev server purposes, load index via Sinatra. Eventually, just do it
# with Apache.
get '/' do
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

get '/form/:form_id'
  # return form for authenticated user
end

put '/form/:form_id'
  # update form for authenticated user
end

delete '/form/:form_id'
  # delete form for authenticated user
end
