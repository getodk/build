# Contributing to Build
We want to make Build the easiest, most foolproof form design tool we can. To do that, we need your help. Even if you don't write code, you are a valuable member of our community, and there are many ways you can help vitally improve the project.

## Getting Involved
One of the easiest ways you can participate is to help us [track down bugs](https://github.com/getodk/build/issues). Did you run into some odd or puzzling behaviour? Did a form you made in Build fail to work in Central or Collect? We want to know! Please do a quick search of the issues list to see if it's something that's already been submitted. Please do make an effort to figure out if the issue is related to Build, or some other tool you are using. But when in doubt, submit your problem anyway.

Of course, we also then need help fixing those issues, or adding new features to make Build more powerful. If you're just getting started working with the project, we encourage you to browse the issues list for smaller tickets that can help you ease into the codebase. We'll make an effort to tag these issues with "quick win".

## Questions and Discussion
If you are having trouble with making Build work correctly, we encourage you to visit the [forum](https://forum.getodk.org/) where a great many of your knowledgeable peers can help you with your problem.

If you're looking for help or discussion on _how_ Build works and how to understand or update its code, 
the [architecture guide](architecture.md) and the ODK [developer Slack](http://slack.getodk.org) are for you. 
If you don't want to sign up for Slack, please feel free to open an issue ticket here on GitHub.

## Developing Code
Follow the [developer guide](develop.md) to get started working on the codebase.

## Contributing Code
In the spirit of the [ODK docs contributing tips](https://docs.getodk.org/contributing-tips/):

* Create the smallest possible PR addressing exactly one issue. This makes review fast and simple.
* PRs addressing multiple issues will be asked to be resubmitted as separate PRs for each issue.

If you're starting work on an issue ticket, please leave a comment to that effect. 
As you write code, the usual guidelines apply; please ensure you are following existing conventions:

* Our JS style is relatively lenient; the only rules we follow absolutely are:
    * Use semicolons.
    * Function-block braces go on their own lines, unless the entire function is inline.
    * Single-quote string literals.
    * Use `var f = function()` syntax rather than `function f` syntax.
    * Use `dict[key]` syntax rather than `dict.key` syntax. Example: short label.
    * Prefix jQuery selection objects with `$`.
* Format your commit messages appropriately:
    * At the very least, use `new:`, `improve:`, `bug:`, `refactor:`, or `noop:` for new features, improvements to existing functionality or code, fixes, big code refactors, and small low-impact changes (eg style fixes or comments) respectively.
    * Tag with the GitHub issue number if relevant; eg: `bug #41:`.
    * If you're feeling ambitious, also tag the area of code you worked on. Look through previous commits for representative examples. An example would be `validation/bug #42: dashes should be allowed in data names.`.
    * Ensure that your leading commit line is 72 characters or fewer, and if you include further text in your commit message that there is an empty line following the leading line.

Once you feel ready to share your progress, please feel free to submit a Pull Request even if you're not quite done. 
This lets others look over your work and make suggestions before you spend too much time in some particular direction. 
[Here](https://yangsu.github.io/pull-request-tutorial/) is a great guide on the process of creating a PR.


