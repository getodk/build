# Takes a hash of string and file parameters and returns a string of text
# formatted to be sent as a multipart form post.
#
# Author:: Cody Brimhall <mailto:cbrimhall@ucdavis.edu>
# Created:: 22 Feb 2008

# Modified by Clint Tseng on 2010/12/07 to take strings and pretend they're text/xml files.


require 'cgi'

module Rack
module Utils
module Multipart
  VERSION = "1.0.0" unless const_defined?(:VERSION)

  # Formats a given hash as a multipart form post
  # If a hash value responds to :string or :read messages, then it is
  # interpreted as a file and processed accordingly; otherwise, it is assumed
  # to be a string
  class Post
    # We have to pretend like we're a web browser...
    USERAGENT = "Mozilla/5.0 (Macintosh; U; PPC Mac OS X; en-us) AppleWebKit/523.10.6 (KHTML, like Gecko) Version/3.0.4 Safari/523.10.6" unless const_defined?(:USERAGENT)
    BOUNDARY = "cqjI9GVDB1MIYNuuuxLM253XTW2OXVGvpWRorY6nesI4eIxQqFr5SyMFUxtLzWU" unless const_defined?(:BOUNDARY)
    CONTENT_TYPE = "multipart/form-data; boundary=#{ BOUNDARY }" unless const_defined?(:CONTENT_TYPE)
    HEADER = { "Content-Type" => CONTENT_TYPE, "User-Agent" => USERAGENT } unless const_defined?(:HEADER)

    def self.prepare_query(params)
      fp = []

      params.each do |k, v|
        # Are we trying to make a file parameter?
        if v.is_a? Hash then
          fp.push(FileParam.new(k, v[:filename], v[:content]))
        # We must be trying to make a regular parameter
        else
          fp.push(StringParam.new(k, v))
        end
      end

      # Assemble the request body using the special multipart format
      query = fp.collect {|p| "--" + BOUNDARY + "\r\n" + p.to_multipart }.join("")  + "--" + BOUNDARY + "--"
      return query, HEADER
    end
  end

  private

  # Formats a basic string key/value pair for inclusion with a multipart post
  class StringParam
    attr_accessor :k, :v

    def initialize(k, v)
      @k = k
      @v = v
    end

    def to_multipart
      return "Content-Disposition: form-data; name=\"#{CGI::escape(k)}\"\r\n\r\n#{v}\r\n"
    end
  end

  # Formats the contents of a file or string for inclusion with a multipart
  # form post
  class FileParam
    attr_accessor :k, :filename, :content

    def initialize(k, filename, content)
      @k = k
      @filename = filename
      @content = content
    end

    def to_multipart
      # If we can tell the possible mime-type from the filename, use the
      # first in the list; otherwise, use "application/octet-stream"
      return "Content-Disposition: form-data; name=\"#{CGI::escape(k)}\"; filename=\"#{ filename }\"\r\n" +
             "Content-Type: text/xml\r\n\r\n#{ content }\r\n"
    end
  end
end
end
end

