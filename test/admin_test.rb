require "test_helper"

context "admin" do
  setup do
    @app = OdkBuild
  end

  context "/login" do
    setup do
      @admin = User.create(:username => "adminuser", :password => "adminpass")
      @admin.admin = true
      @user = User.create(:username => "user", :password => "pass")
      Warden::Strategies[:odkbuild].any_instance.stubs(:parse_login).returns([@admin, @user])
      User.any_instance.stubs(:authenticate?).returns(true)
      post '/login', :username => "adminuser|user", :password => "adminpass"
    end
    asserts("admin's username when logging in as user") {
        JSON.parse(topic.body)["username"] }.equals("user")
  end

  context "rake" do
    setup do
      @rake = Rake::Application.new
      Rake.application = @rake
      load "Rakefile"
    end

    context "admin:add" do
      setup do
        @user = User.create(:username => "user", :password => "pass")
        User.stubs(:find).returns(@user)
        swallow_output { @rake["admin:add"].invoke("user") }
        @user
      end
      should("grant admin privileges") { topic.is_admin? }
    end

    context "admin:remove" do
      setup do
        @user = User.create(:username => "user", :password => "pass")
        User.stubs(:find).returns(@user)
        @user.admin = true
        swallow_output { @rake["admin:remove"].invoke("user") }
        @user
      end
      should("revoke admin privileges") { !topic.is_admin? }
    end
  end
end

