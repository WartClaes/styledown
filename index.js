var Marked = require('marked');
var Jade = require('jade');
var Cheerio = require('cheerio');
var extend = require('util')._extend;

module.exports = Styledown;
var Filters = Styledown.filters = {};

/**
 * Document.
 */

function Styledown (src, options) {
  this.raw = src;
  this.options = extend(extend({}, Styledown.defaults), options || {});
  this.$ = Cheerio.load(Marked(src));

  Filters.addClasses(this.$, this.options);
  Filters.unpackExamples(this.$, this.options);
}

Styledown.defaults = {
  /**
   * Disable template if true
   */
  bare: false,

  /**
   * HTML template
   */
  template: [
    "<!doctype html>",
    "<html>",
    "<head>",
    "<meta charset='utf-8'>",
    "<title>Styledown</title>",
    "</head>",
    "<body sg-content>",
    "</body>",
    "</html>"
  ].join("\n"),

  /**
   * Things to put into `head`
   */
  head: "",

  /**
   * Prefix for classnames
   */
  prefix: 'sg',
};

/**
 * Shorthand for parsing.
 */

Styledown.parse = function (source, options) {
  return new Styledown(source, options).toHTML();
};

Styledown.prototype = {
  toHTML: function() {
    var html = this.$.html();

    if (!this.options.bare) {
      // Unpack template
      var $ = Cheerio.load(this.options.template);
      $('[sg-content]').append(html).removeAttr('sg-content');
      $('html, body').addClass(this.options.prefix);
      $('head').append(this.options.head);

      html = $.html();
    }

    return html;
  },
};

/**
 * Filters mixin
 */

extend(Filters, {
  /**
   * Adds HTML classnames to things
   */

  addClasses: function ($, options) {
    var prefix = options.prefix;

    $("*").addClass(prefix);
  },

  /**
   * Unpacks `pre` blocks into examples.
   */

  unpackExamples: function ($, options) {
    var pre = options.prefix;

    $('pre').each(function() {
      var code = this.text();
      var html = Jade.render(code);

      var canvas = "<div class='"+pre+"-canvas'>"+html+"</div>";
      var codeblock = "<pre class='"+pre+"-code'>"+highlight(html)+"</pre>";
      canvas = "<div class='"+pre+"-code-block'>" + canvas + codeblock + "</div>";

      var x = this.replaceWith(canvas);
    });
  },

  /**
   * Break it apart into sections
   */

  sectionize: function ($, tag, options) {
    options = extend({
      class: ''
    }, options);

    $(tag).each(function (i) {
      var $heading = this;
      var $extras = $heading.nextUntil(tag);
      $heading.before("<section class='"+options.class+"'>");

      var $div = $("section").eq(-1);
      $div.addClass($heading.attr('id'));
      $div.append($heading.remove());
      $div.append($extras.remove());
    });
  }
});

/**
 * Syntax highlight?
 */

function highlight (html) {
  var Html = require('html');
  var Hljs = require('highlight.js');

  html = Html.prettyPrint(html, { indent_size: 2 });
  html = Hljs.highlight('html', html).value;
  return html;
}
