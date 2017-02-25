require 'rubygems'
require 'bundler/setup'

require 'yaml'
require 'json'

require 'sequel'

require './server/config_manager'

require './server/model/user'
require './server/model/form'
require './server/model/connection_manager'

require './server/lib/extensions'

ConfigManager.load

namespace :deploy do
  desc 'Compile and bundle assets for the application'
  task :build do
    require 'yui/compressor'

    root = File.dirname __FILE__
    assets = YAML.load_file("#{root}/server/assets.yml")
    out = File.open "#{root}/public/javascripts/build.js", 'w'

    # javascript
    puts 'bundling JS...'
    compressor = YUI::JavaScriptCompressor.new :munge => true
    assets['javascripts'].each do |filename|
      out.puts "/* #{filename}.js */"
      out.puts compressor.compress( File.open "#{root}/public/javascripts/#{filename}.js", 'r' )
      puts "...#{filename}.js [ok]"
    end

    # asset build timestamp
    puts 'writing build time...'
    File.open( "#{root}/.build_time", 'w' ) { |f| f.write Time.new.to_i }

    # fin
    puts 'done!'
  end
end

namespace :db do
  task :migrate do
    Sequel.extension :migration, :core_extensions
    db = ConnectionManager.rackless_connection
    Sequel::Migrator.apply(db, 'server/model/migrations')
    db.disconnect

    puts "migrated successfully."
  end
end

namespace :admin do
  desc "Grant a user admin privileges"
  task :add, :username do |t, args|
    db = ConnectionManager.rackless_connection

    username = args[:username]
    abort "Missing required parameter: username" unless username
    user = User.find(username)
    abort "Could not find user: #{username}" if user.nil?
    user.admin = true
    user.save
    puts "granted #{username} admin privileges"
  end

  desc "Revoke a user's admin privileges"
  task :remove, :username do |t, args|
    db = ConnectionManager.rackless_connection

    username = args[:username]
    abort "Missing required parameter: username" unless username
    user = User.find(username)
    user.admin = false
    user.save
    puts "revoked admin privileges from #{username}"
  end

  desc "List all users with admin priviliges"
  task :list do
    db = ConnectionManager.rackless_connection

    admins = db[:users].query do |q|
      q.add "admin", :equals, true
    end
    puts "users with admin privileges:"
    admins.each { |admin| puts "#{admin["display_name"]} (#{admin["email"]})" }
  end
end

desc "Run all tests"
task :test do
  require 'rake/testtask'

  Rake::TestTask.new do |t|
    t.libs << "test"
    t.pattern = "test/**/*_test.rb"
    t.verbose = false
  end
end

