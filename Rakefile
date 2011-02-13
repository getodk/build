require "rufus/tokyo"
require 'model/user'
require 'model/form'
require "model/connection_manager"

@db = ConnectionManager.rackless_connection

namespace :admin do
  desc "Grant a user admin privileges"
  task :add, :username do |t, args|
    username = args[:username]
    abort "Missing required parameter: username" unless username
    user = User.find(username)
    user.admin = true
    user.save
    puts "granted #{username} admin privileges"
  end

  desc "Revoke a user's admin privileges"
  task :remove, :username do |t, args|
    username = args[:username]
    abort "Missing required parameter: username" unless username
    user = User.find(username)
    user.admin = false
    user.save
    puts "revoked admin privileges from #{username}"
  end

  desc "List all users with admin priviliges"
  task :list do
    admins = @db[:users].query do |q|
      q.add "admin", :equals, true
    end
    puts "users with admin privileges:"
    admins.each { |admin| puts "#{admin["display_name"]} (#{admin["email"]})" }
  end
end

