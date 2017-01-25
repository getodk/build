# encoding: UTF-8

require 'tokyo_tyrant'
require 'csv'
require 'json'
require 'erb'

PORTS = { 'users' => 4900, 'forms' => 4901, 'form_data' => 4902 }
ROOT_DIR = ARGV[0]

def start_db(which)
  base = "#{ROOT_DIR}/#{which}"
  `ttserver -dmn -port #{PORTS[which]} -pid "#{base}.pid" "#{base}.tch"`
  sleep(0.5) while !File.exist?("#{base}.pid")
  return TokyoTyrant::DB.new('localhost', PORTS[which])
end
def end_db(which)
  pid = (File.read "#{ROOT_DIR}/#{which}.pid")
  `kill -s term #{pid}`
end

begin
  # dump users to csv; build form-uid => owner-id mapping.
  user_db = start_db('users')
  user_seq = 1
  user_csv_path = File.expand_path("#{ROOT_DIR}/users.csv")
  owner_map = {}
  CSV.open(user_csv_path, 'w') do |user_csv|
    user_db.each do |username, raw|
      data = Marshal.load(raw)
      data[:forms].each{ |uid| owner_map[uid] = user_seq }

      user_csv << [ user_seq, data[:email], username, data[:password], data[:pepper] ]

      user_seq += 1
      STDOUT.write("processed #{user_seq} users.\n") if (user_seq % 10000) == 0
    end
  end
  STDOUT.write("<< written #{user_csv_path}\n\n")

  # now dump forms to csv; build form-uid => form-id, form-uid => metadata mappings.
  form_db = start_db('forms')
  form_seq = 1
  form_csv_path = File.expand_path("#{ROOT_DIR}/forms.csv")
  form_id_map = {}
  form_metadata_map = {}
  CSV.open(form_csv_path, 'w') do |form_csv|
    form_db.each do |uid, raw|
      next if owner_map[uid].nil?
      data = Marshal.load(raw)

      form_id_map[uid] = form_seq
      form_metadata_map[uid] = data[:metadata] || {}

      form_csv << [ form_seq, uid, data[:title], owner_map[uid] ]

      form_seq += 1
      STDOUT.write("processed #{form_seq} forms.\n") if (form_seq % 10000) == 0
    end
  end
  STDOUT.write("<< written #{form_csv_path}\n\n")

  # finally dump form data to csv.
  form_data_db = start_db('form_data')
  form_data_csv_path = File.expand_path("#{ROOT_DIR}/form_data.csv")
  form_data_counter = 1
  CSV.open(form_data_csv_path, 'w') do |form_data_csv|
    form_data_db.each do |uid, raw|
      next if owner_map[uid].nil? or form_id_map[uid].nil?
      data = { 'controls' => JSON.parse(raw) }
      data['metadata'] = form_metadata_map[uid]

      form_data_csv << [ form_id_map[uid], data.to_json ]

      form_data_counter += 1
      STDOUT.write("processed #{form_data_counter} formdata.\n") if (form_data_counter % 5000) == 0
    end
  end
  STDOUT.write("<< written #{form_data_csv_path}\n\n")

  # finally finally template and write-out sql script.
  template = File.read(File.join(File.dirname(__FILE__), 'load_data.sql.erb'))
  sql_path = "#{ROOT_DIR}/load_data.sql"
  b = binding
  File.open(sql_path, 'w'){ |sql_out| sql_out << ERB.new(template).result(b) }
  STDOUT.write("<< written #{sql_path}\n\n")

rescue Exception => ex
  puts ex.inspect
  puts ex.backtrace
ensure
  end_db('users')
end

