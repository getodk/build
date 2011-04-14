require 'rubygems'
require 'bundler/setup'

require 'yaml'
require 'yui/compressor'
require 'json'

require 'rufus/tokyo'
require 'rake/testtask'

require './model/user'
require './model/form'
require './model/connection_manager'

@db = ConnectionManager.rackless_connection

namespace :deploy do
  desc 'Compile and bundle assets for the application'
  task :build do
    root = File.dirname __FILE__
    assets = YAML.load_file("#{root}/assets.yml")
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

namespace :analytics do
  desc "Print form count metrics"
  task :form_counts do
    total_forms = max_forms = 0
    users = @db[:users].keys.sort
    users.each do |username|
      user = User.find username
      num_forms = user.forms.count
      puts "#{user.display_name}: #{num_forms}"
      total_forms += num_forms
      max_forms = [max_forms, num_forms].max
    end
    if users.count > 0
      puts "Avg forms per user: #{total_forms / users.count}"
      puts "Max forms per user: #{max_forms}"
    else
      puts "No users"
    end
  end

  desc "Print form length metrics"
  task :form_lengths do
    total_length = max_length = 0
    @db[:form_data].each do |form_id, form_data|
      form_length = JSON.parse(form_data).length
      total_length += form_length
      max_length = [max_length, form_length].max
    end
    num_forms = @db[:form_data].size
    if num_forms > 0
      puts "Avg form length: #{total_length / num_forms}"
      puts "Max form length: #{max_length}"
    else
      puts "No forms"
    end
  end

  desc "Print totals of each control type"
  task :control_counts do
    control_counts = Hash.new(0)
    @db[:forms].each do |form_id, form_data|
      form = Form.find(form_id, true)
      control_counts.merge!(form.control_counts) { |key, count1, count2| count1 + count2 }
    end
    control_counts_ordered = control_counts.to_a.sort { |one, two| two[1] <=> one[1] }
    control_counts_ordered.each do |control_name, control_count|
      puts "#{control_name}: #{control_count}"
    end
  end
end

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

desc "Run all tests"
task :test do
  Rake::TestTask.new do |t|
    t.libs << "test"
    t.pattern = "test/**/*_test.rb"
    t.verbose = false
  end
end

