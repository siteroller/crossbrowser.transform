/*
---
description: Class to parse stylesheets and ammend browser-specific styles as needed.
license: OSI
authors: Sam Goody <siteroller@gmail.com>
provides: [CrossBrowser, CrossBrowser.Transform]
requires: [core/1.3: '*']
...
*/
 
var CrossBrowser = new Class({

	loopstop: 0
	, loadStylesheets: function(){
		var self = this;
		$$('style').each(function(el,i){
			var styles = self.stripComments(el.get('html'),'css');
			self.parse(styles,i);
		});
		$$('link[rel=stylesheet]').each(function(el,i){
			//switch to regex to catch case insensitive domain name changes
			if (href.contains('://') && href.contains(document.domain)) new Request({onSuccess:self.parse});
		});
	}
	, ieLoop: function(){
		var self = this;
		// Loop through stylesheets. IE allows access to styles it doesn't recognise.
		Array.each(document.styleSheets, function(sheet,i){
			Array.each(sheet.rules || sheet.cssRules, function(rule,j){
				var pos = rule.style['moz-transform'];
				if (pos) $$(rule.selectorText).each(function(el){ self.loopMethod(el,pos) });
			});
		});
	}
	, stripComments: function(content, type){
		switch(type){
			case 'css':	return content.replace(/\/\*[^*]*\*\//g, '');
			case 'htm': return content.replace(/<!--|-->/g, '');
			case 'js':  return content.replace(/\/\/.+?(?=\n|\r|$)|\/\*[\s\S]+?\*\//g, '')
				.replace(/@[^\{\};]*;|@[^\{\};]*\{[^\}]*\}/g, '');	
		}
		// 2nd js regex looks like it will cough on regex's with '/*', but claims it works. should be rewritten.
		// return content.replace(/(/\*[\u0000-\uFFFF]*?(?=\*\/)\*/|//[^\u000A|\u000D|\u2028|\u2029]*)/, '');
		// html regex to remove first tag, huh? Have copied it till I can think about it.	
	}
	, parse: function(css, sheet){
		var self = this;
		sheet = document.styleSheets[sheet];
		
		css.split('}').each(function(rule){
			self.parseObj.each(function(find){
				var reg = rule.match(find[1]);
				if (reg) sheet
					.insertRule('{el}{{pre}-{reg}:{is}}'
						.substitute({ el: rule.split('{')[0].trim()
									, pre: find[0] ? self.pre : ''
									, reg: reg[0]
									, is: (Type.isFunction(find[2]) ? find[2] : self[find[2]])
										.bind(self)(rule.split(find[1]).pop().match(/:([^;}]+)/i)[1])
						})
					);
			})
		});
	}
});

CrossBrowser.Transform = new Class({
	
	Implements: [Transform, CrossBrowser]
	
	, parseStyles: function(){
		if (Browser.ie) this.ieLoop(); // Only IE reads unrecognized styles.
		else if (!Browser.firefox) this.loadStylesheets(); // External stylesheets ignored.
	}
	, parseObj: [ [1, /transform(?!-)/i, 'parseRule']
				, [1, /transform-origin/i, 'parseRule']
	]
	, loopMethod: function(el,rule){
		var matrix = this.parseRule(rule);
		this.ieTransform(el, matrix);
	}
});