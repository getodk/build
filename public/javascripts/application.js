/**
 *  application.js - superglue at its finest
 *    Setting up the interface, binding toolbars, loading everything else up.
 *    Everything but the kitchen sink.
 */

var applicationNS = {};

applicationNS.newForm = function()
{
	$('.workspace').empty();
};

$(function()
{
	// Wire up toolpane
	$('.toolPalette a').toolButton();

	// Kick off a new form by default
	applicationNS.newForm();
});