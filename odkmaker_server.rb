require 'rubygems'
require 'sinatra'
require 'json'
require 'rufus/tokyo'

# For dev server purposes, load index via Sinatra. Eventually, just do it
# with Apache.
get '/' do
  erb :index
end

# Eventually stuff like parsing images out to base64, etc will go here.