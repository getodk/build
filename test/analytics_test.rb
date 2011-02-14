require "test_helper"

context "analytics" do
  setup do
    @user = User.create(:username => "user", :password => "pass")
    @rake = Rake::Application.new
    Rake.application = @rake
    load "Rakefile"
  end

  context "form" do
    setup do
      @form = Form.create({ "title" => "form_title" }, @user)
      @form.update ({ "controls" => [
        { "type" => "inputText" },
        { "type" => "group", "children" => [
          { "type" => "inputText" },
          { "type" => "inputDate" },
        ]}
      ]})
      @form.control_counts
    end
    should("recursively count its control types") {
      topic["inputText"] == 2 &&
      topic["inputDate"] == 1 &&
      topic["group"] == 1
    }
  end
end
