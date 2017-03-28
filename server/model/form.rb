# encoding: UTF-8

require 'json'

require './server/model/connection_manager'
require './server/lib/extensions'

class Form
  def self.find(uid)
    data = Form.table.filter( :uid => uid.to_s, :deleted_at => nil ).first

    return nil if data.blank?
    return (Form.new data)
  end

  def self.find_by_user(user)
    return Form.table.filter( :user_id => user.id, :deleted_at => nil ).map{ |data| Form.new(data) } || []
  end

# Class
  def data(summary = false)
    result = {
      :id => self.uid,
      :title => self.title
    }
    unless summary
      blob = self.blob
      result.merge!({
        :controls => blob[:controls],
        :metadata => blob[:metadata],
        :owner => self.owner.data(true)
      })
    end
    return result
  end

  def self.create(data, owner)
    begin
      uid = (String.random_chars 6)
    end while !Form.find(uid).blank?

    form = nil
    begin
      ConnectionManager.db.transaction do
        Form.table.insert({ :uid => uid, :title => data[:title], :user_id => owner.id })

        form = (Form.find uid)
        Form.blob_table.insert({
          :form_id => form.id,
          :data => { :controls => data[:controls], :metadata => data[:metadata] }.to_json
        })
      end
    rescue Sequel::DatabaseError
      return nil
    end

    form.log_audit!('create')
    return form
  end

  def update(data)
    self.title = data[:title] unless data[:title].nil?
    self.blob = { :controls => data[:controls], :metadata => data[:metadata] }
  end

  def delete!
    # we soft delete just in case.
    @data[:deleted_at] = DateTime.now
    self.save
  end

  def log_audit!(type)
    # TODO: for some reason if we don't join this thread the database statement
    # never runs and the thread just hangs. right now we're fast enough (<60ms)
    # that it isn't a big perf hit to run this in-line, but it'd be nice to be
    # able to background it in the future sometime.
    Thread.new{ Form.audit_table.insert({ :form_id => self.id, :timestamp => DateTime.now, :type => type }) }.join
  end

  def save
    ConnectionManager.db.transaction do
      row.update(@data)
      blob_row.update({ :data => @blob.to_json }) unless @blob.nil?
    end
    self.log_audit!('update')
  end

  def ==(other)
    return false unless other.is_a? Form
    return other.id == self.id
  end

# Fields
  def id
    return @data[:id]
  end

  def uid
    return @data[:uid]
  end

  def title
    return @data[:title]
  end
  def title=(title)
    @data[:title] = title
  end

  def owner
    return User.find_by_id @data[:user_id]
  end

  def blob
    blob = Form.blob_table.filter( :form_id => self.id ).first
    result = JSON.parse(blob[:data] || "", :symbolize_names => true ) unless blob.blank?
  end
  def blob=(blob)
    @blob = blob
  end

private
  def initialize(data)
    @data = data
  end

  def self.table
    return ConnectionManager.db[:forms]
  end

  def self.blob_table
    return ConnectionManager.db[:form_data]
  end

  def self.audit_table
    return ConnectionManager.db[:update_audit]
  end

  def row
    return Form.table.filter( :uid => self.uid, :deleted_at => nil )
  end

  def blob_row
    return Form.blob_table.filter( :form_id => self.id )
  end
end

