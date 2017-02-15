module Build
  class TLS
    def initialize(app, options = {})
      @app = app
    end

    def call(env)
      @app.call(env).tap do |response|
        # grab headers
        headers = response[1]

        # add HSTS
        headers['Strict-Transport-Security'] = 'max-age=7776000'

        # mark cookie as secure:
        headers['Set-Cookie'] += '; secure' unless headers['Set-Cookie'].nil?
      end
    end
  end
end

