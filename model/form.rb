# encoding: UTF-8

require 'json'

require './model/connection_manager'
require './lib/extensions'

class Form
  def self.find(key, get_form_data = false)
    key = key.to_s

    data = ConnectionManager.connection[:forms][key]

    return nil if data.nil?

    if get_form_data
      form_data = ConnectionManager.connection[:form_data][key] || ''
      return (Form.new key, data, form_data)
    else
      return (Form.new key, data)
    end
  end

# Class
  def data(summary = false)
    result = @data.dup
    result['id'] = @key
    result['controls'] = (JSON.parse @form_data) unless @form_data.nil?
    result['metadata'] = self.metadata unless summary

    return result.force_encoding!
  end

  def self.create(data, owner)
    begin
      key = (String.random_chars 6)
    end while !ConnectionManager.connection[:forms][key].nil?

    ConnectionManager.connection[:forms][key] = {
      :title => data['title'],
      :description => (data['description'] || ''),
      :owner => owner.username,
      :metadata => (data['metadata'].is_a? String) ? data['metadata'] : data['metadata'].to_json
    }

    ConnectionManager.connection[:form_data][key] = data['controls'].to_json

    return (Form.find key, true)
  end

  def update(data)
    self.title = data['title'] unless data['title'].nil?
    self.description = data['description'] unless data['description'].nil?
    self.metadata = data['metadata'] unless data['metadata'].nil?
    @form_data = data['controls'].to_json unless data['controls'].nil?
  end

  def delete!
    # delete the reference instead of the actual form, just in case
    owner = self.owner
    owner.remove_form self
    owner.save
  end

  def save
    ConnectionManager.connection[:forms][@key] = @data
    ConnectionManager.connection[:form_data][@key] = @form_data unless @form_data.nil?
  end

  def ==(other)
    return false unless other.is_a? Form
    return other.id == @key
  end

  # Recursively counts how many controls are in this form.
  def control_counts(control_group = self.data[:controls])
    control_counts = Hash.new(0)
    return control_counts unless control_group
    control_group.each do |control|
      control_counts[control["type"]] += 1
      if control["type"] == "group"
        child_control_counts = self.control_counts(control["children"])
        control_counts.merge!(child_control_counts) { |key, count1, count2| count1 + count2 }
      end
    end
    control_counts
  end

# Fields
  def id
    return @key
  end

  def title
    return @data['title']
  end
  def title=(title)
    @data['title'] = title
  end

  def description
    return @data['description']
  end
  def description=(description)
    @data['description'] = description
  end

  def owner
    return User.find @data['owner']
  end

  def form_data
    return @form_data
  end
  def form_data=(form_data)
    @form_data = form_data
  end

  def metadata
    begin
      return (JSON.parse @data['metadata']) unless @data['metadata'].nil? || (@data['metadata'] == '')
    rescue JSON::ParserError => e
      return {}
    end

    return {}
  end
  def metadata=(metadata)
    metadata_serialized = metadata.to_json unless metadata.is_a? String
    @data['metadata'] = metadata_serialized
  end

private
  def initialize(key, data, form_data = nil)
    @key, @data = key, data
    @form_data = form_data unless form_data.nil?
  end
end
