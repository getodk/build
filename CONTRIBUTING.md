Contributing to Build
=====================

We want to make Build the easiest, most foolproof form design tool we can. To do that, we need your help. Even if you don't write code, you are a valuable member of our community, and there are many ways you can help vitally improve the project.

Getting Involved
----------------

One of the easiest ways you can participate is to help us [track down bugs](https://github.com/opendatakit/build/issues). Did you run into some odd or puzzling behaviour? Did a form you made in Build fail to work in Aggregate or Collect? We want to know! Please do a quick search of the issues list to see if it's something that's already been submitted. Please do make an effort to figure out if the issue is related to Build, or some other tool you are using. But when in doubt, submit your problem anyway.

Of course, we also then need help fixing those issues, or adding new features to make Build more powerful. If you're just getting started working with the project, we encourage you to browse the issues list for smaller tickets that can help you ease into the codebase. We'll make an effort to tag these issues with "quick win".

Questions and Discussion
------------------------

If you are having trouble with making Build work correctly, we encourage you to visit the [mailing list](https://groups.google.com/forum/#!forum/opendatakit) where a great many of your knowledgeable peers can help you with your problem.

If you're looking for help or discussion on _how_ Build works and how to understand or update its code, the ODK [developer Slack](https://opendatakit.slack.com) is for you. If you don't want to sign up for Slack, please feel free to open an issue ticket here on GitHub.

Contributing Code
-----------------

If you're starting work on an issue ticket, please leave a comment to that effect As you write code, the usual guidelines apply; please ensure you are following existing conventions:

* Our JS style is relatively lenient; the only rules we follow absolutely are:
    * Use semicolons.
    * Function-block braces go on their own lines, unless the entire function is inline.
    * Single-quote string literals.
    * Use `var f = function()` syntax rather than `function f` syntax.
    * Prefix jQuery selection objects with `$`.
* Format your commit messages appropriately:
    * At the very least, use `new:`, `improve:`, `bug:`, `refactor:`, or `noop:` for new features, improvements to existing functionality or code, fixes, big code refactors, and small low-impact changes (eg style fixes or comments) respectively.
    * Tag with the GitHub issue number if relevant; eg: `bug #41:`.
    * If you're feeling ambitious, also tag the area of code you worked on. Look through previous commits for representative examples. An example would be `validation/bug #42: dashes should be allowed in data names.`.
    * Ensure that your leading commit line is 72 characters or fewer, and if you include further text in your commit message that there is an empty line following the leading line.

Once you feel ready to share your progress, please feel free to submit a Pull Request even if you're not quite done. This lets others look over your work and make suggestions before you spend too much time in some particular direction. [Here](https://yangsu.github.io/pull-request-tutorial/) is a great guide on the process of creating a PR.

Navigating the Code
-------------------

### Ruby

The Ruby code manages user accounts and form storage, in addition to serving as a sort of proxy gateway to perform functions not available in web browers. Most of the relevant code is in `odkbuild_server.rb`, organized by API section. Note that all permissions checks are done directly inline, as exemplified by the code definition for `put '/user/:username'`.

`asset_manager.rb` and `config_manager.rb` are small utilities that read up and manage, respectively, Javascript assets that the web frontend needs, and database configurations that the server needs. `warden_odkbuild.rb` handles parsing and verifying the user's authentication status. Model and database code are found in `/model`, and some miscellenia in `/lib`.

### Javascript

Most of what the user actually interacts with is purely in Javascript. It's all located within `/public/javascripts`.

The two most likely things you may wish to do are:

* Change how a type of control works, or add a new control type. You'll want to check out the bottom of `controls.js`, and then take a look at `data.js` to define how your changes or additions serialize to XForms XML. (These should be unified to a simple one-stop location in an imminent release similar to `impl.limits.js` below.)
* Modify or add a validation. For this, the only place you should really have to look is `impl.limits.js`.

Otherwise, files of note include:

* `data.js` handles all kinds of top-level form data processing: serializing form data for storage, loading it back in, exporting to XML, etc.
* `data-ui.js`, which handles all user interactions around dealing with entire forms: opening, closing, exporting, etc; anything that calls into `data.js` is probably here.
* `options-editor.js` is the code underlying the pop-up options editor experience.
* `property-editor.js` renders and manages all of the property controls that appear in the right sidebar, and pushes updates back into the control.
* `validation.js` is the core code that routes data in order to _perform_ validation, as opposed to `impl.limits.js` which _defines_ how the validations behave.

Staging
-------

The [staging.build.opendatakit.org](http://staging.build.opendatakit.org) site is set up to track the `staging` branch of this repository. You can see the status of the CI build on the [staging branch page on CircleCI](https://circleci.com/gh/opendatakit/build/tree/staging); the deploy should kick off on the staging server no more than two minutes after the build, and should complete within a minute of that. You can always see which SHA is live by going to `Help > About` in the application itself.

