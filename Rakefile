require "json"
require "rufus/tokyo"
require 'model/user'
require 'model/form'
require "model/connection_manager"

@db = ConnectionManager.rackless_connection

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
    control_counts = {}
    @db[:form_data].each do |form_id, form_data|
      form_controls = JSON.parse(form_data)
      form_controls.each do |control|
        if control_counts.has_key? control["type"]
          control_counts[control["type"]] += 1
        else
          control_counts[control["type"]] = 1
        end
      end
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

