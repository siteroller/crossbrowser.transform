/*
Credits: 
stripComments based on http://james.padolsey.com/javascript/javascript-comment-removal-revisted, linked to in cssSandpaper.
IEMatrix functions are based on: 
	http://extremelysatisfactorytotalitarianism.com/blog/?p=922#theCode
	http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php
Transform Matricis from Wikipedia - http://en.wikipedia.org/wiki
	/Matrix_(mathematics)
	/Linear_transformation
	/Transformation_matrix
Fancy Matrix multiplication based on the theory at http://easycalculation.com/matrix
	/learn-matrix-multiplication.php
	/matrix-multiplication.php
*/

var CrossBrowser = new Class({

	loopstop: 0

	, loadStylesheets: function(){
		var self = this;
		$$('style').each(function(el,i){
			self.parse(el.get('html'),i);
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
			case 'js':
				// 2nd regex looks like it will cough on regex's with '/*', but claims it works. should be rewritten.
				content = content.replace(/\/\/.+?(?=\n|\r|$)|\/\*[\s\S]+?\*\//g, '').replace(/@[^\{\};]*;|@[^\{\};]*\{[^\}]*\}/g, '');
				//content = content.replace(/(/\*[\u0000-\uFFFF]*?(?=\*\/)\*/|//[^\u000A|\u000D|\u2028|\u2029]*)/, '');
			break;
			case 'htm':
				// to remove first tag, huh? Have copied it till I can think about it.
				content = content.replace(/<!--|-->/, '');
			break;
		}
		return content;
	}
	, convert: function(num){
		return parseFloat(num)
	
	}
});

CrossBrowser.Transform = new Class({
	
	Implements: CrossBrowser
	
	, initialize: function(){
		this.pre = {chrome:'-webkit',safari:'-webkit', opera:'-o',firefox:'-moz'}[Browser.name];
	}
	, extendDOM: function(els){
		var hash = {}
			, self = this
			, methods = ['transform','matrix','rotate','skew','skewX','skewY','scale','scaleX','scaleY','translate','translateX','translateY'];
		
		methods.each(function(method){
			hash[method] = function(x, y, origin){
				if (Type.isArray(y)){ origin = y; y = null; }
				var matrix = self.getMatrix(method, x, y);
				self.transform(this, method, matrix, origin);
				return this;
			};
		});
		els ? $$(els).each(function(el){Object.merge(el,hash)}) : Element.implement(hash);
	}
	, getMatrix: function(transform, x, y){
		
		var t = transform.toLowerCase()
			, unit = {c:'', k:'deg', r:'px', o:'deg'}[t.substr(1,1)];
		if (t == 'transform') return this.parseRule(x);
		if (t == 'matrix'){
			var suf = Browser.firefox ? 'px' : 0;
			return [x[0], x[2], x[1], x[3], x[4]||0 + suf, x[5]||0 + suf];
		}
		if (this.pre) return x + unit + (y ? ',' + y + unit : '');
		
		var end = t.slice(-1)
			, rad = 0.0174532925
			, rep = +(t.substr(0,5) == 'scale');

		if (end == 'y'){
			y = x;
			x = rep;
			t = t.slice(0,-1);
		} else if (end == 'x'){
			y = rep;
			t = t.slice(0,-1);
		} else if (t == 'rotate'){
			rad *= x;
			x = rad.sin();
			y = rad.cos();
		} else if (!y)
			y = rep ? x : 0;
		if (t == 'skew'){
			x = (x * rad).tan();
			y = (y * rad).tan();
		}
		
		return {
			scale:[x, 0, 0, y, 0, 0]
			, skew:[1, y, x, 1, 0, 0]
			, rotate:[y, x, -x, y, 0, 0]
			, translate:[1, 0, 0, 1, x, y]
			// ToDo; Not part of W3C spec.
			, squeeze: [x, 0, 0, 1/x]
			, project: [0, 0, 0, 1]
			, reflect: [1, 0, 0, -1]
			, invert: []
		}[t];
	}
	, transform: function(el, transform, matrix, origin){
		if (!this.pre) return this.ieTransform(el, matrix, origin);
		origin = origin || [50,50];
		if (el.style.position == 'static') el.setStyle('position','relative');//el.getStyle('position')
		el.setStyle(this.pre + '-transform', transform == 'transform' ? matrix : transform + '(' + matrix + ')');
		el.setStyle(this.pre + '-transform-origin', origin[0] + 'px ' + origin[1] + 'px');
	}
	, ieTransform: function(el,entries,h,w){
		if (!h){
			var size = el.getCoordinates();
			h = size.height / 2;
			w = size.width / 2;
			x = size.left;
			y = size.top;
		};
		
		var matrix = a + ', M21=' + b + ', M12=' + c + ', M22=' + d
			, filter = Browser.ie6 ? 'filter' : '-ms-filter'
			, transform = 'progid:DXImageTransform.Microsoft.Matrix(M11=' + matrix + ', SizingMethod="auto expand")'
			, sx = Math.abs(c) * h + (Math.abs(a) - 1) * w
			, sy = Math.abs(b) * w + (Math.abs(d) - 1) * h;

		el.setStyles({
			left: Math.round(x + e - sx)
			, top: Math.round(y + f - sy)
			, filter: transform
			, height: 200
			, width: 200
		});
	}
	, parseStyles:function(){
		if (Browser.ie) ieLoop(); // Only IE reads unrecognized styles.
		else if (!Browser.firefox) loadStylesheets(); // FF doesn't need parsing. No External Stylesheets.
	}
	, parse: function(css,sheet){
		sheet = document.styleSheets[sheet];
		var style, rule = new RegExp(regexs.prefixes + '-moz(-transform[^;}]+)', 'gi');
		
		while (style = rule.exec(css)){
			// Remove the '%','em','px' from tx & ty. FF uses <length>, webkit [and opera?] use unitless <number>s: https://developer.mozilla.org/En/CSS/-moz-transform
			
			document.styleSheets[0].insertRule(style[1] + '{' + this.pre + style[2] + '}');
		}
	}
	, parseRule: function(rule, browser){
		// Parses -moz-transform stylerules.
		if (Browser.firefox) return rule;
		if (this.pre == '-webkit')
			return rule.replace(/(matrix\s*\((?:\s*[-\.\d]+\s*,){4})(\s*\d+)[^,]*,(\s*\d+)[^)]*\)/gi, '$1$2,$3)');
		var style
			, a = [1,0,0,1,0,0]
			, reg = /([^(]+)\(([^)]*)\)/gi;
			
		while (style = reg.exec(rule)){
			var transform = style[1].trim()
				, t = style[2].split(/\s*,\s*/).map(this.convert)
				, b = this.getMatrix(transform, t[0], t[1]);
			a = [
				a[1] * b[2] + a[0] * b[0]
				, a[2] * b[0] + a[3] * b[2]
				, a[0] * b[1] + a[1] * b[3]
				, a[2] * b[1] + a[3] * b[3]
				, a[0] * b[4] + a[1] * b[5] + a[4]
				, a[2] * b[4] + a[3] * b[5] + a[5]
			];
		}
		return a;
	}
	, loopMethod: function(el,rule){
		var matrix = this.parseRule(rule);
		document.styleSheets[0].insertRule(style[1], this.ieTransform(el, matrix)); // ieTransform should be reworked to return a matrix to apply.
	}
});

CrossBrowser.Transform.implement({
	ieTransform: function(el, matrix, origin){
		
		origin = origin || [50,50];
		el.setStyle(
			Browser.ie6 ? 'filter' : '-ms-filter',
			'progid:DXImageTransform.Microsoft.Matrix(M11={a}, M12={c}, M21={b}, M22={d}, SizingMethod="auto expand")'.substitute({a:matrix[0],b:matrix[1],c:matrix[2],d:matrix[3]})
		);
		
		var x = el.clientWidth / 2 - origin[0]
			, y = el.clientHeight / 2 - origin[1]
			, left = x * matrix[0] + y * matrix[2] + origin[0] + matrix[4] - el.offsetWidth / 2
			, top = x * matrix[1] + y * matrix[3] + origin[1] + matrix[5] - el.offsetHeight / 2;
		
		el.style.left = left;
		el.style.top = top;
		
		if (false) var originMarker = new Element('div',{styles:{position:'absolute', width:3, height:3, 'background-color':'red', top:origin[0]-1, left:origin[1]-1, 'line-height':1, overflow:'hidden'}}).inject(el);
	}
});

/*
Developer Info:
0. Yes, we want your help. 
If you are good at math, code, or putting things through their paces, fork and hack! 

1. Yup, we put commas first. Haskel style.
For some perspective, read the comments:
	http://ajaxian.com/archives/is-there-something-to-the-crazy-comma-first-style
	http://gist.github.com/357981

2. And yeah, we really did define ieTransform just to overwrite it using .implement.
#1 is based on totalitarianism's concepts, and provides a smoother result for animations in IE.
But I have not been able to work out setting the origin. Yet.
#2 is based on Dylan's math, and works.
If you can work out #1, we'll put your name in lights!

3. Function Map:
initialize() Set browser-specific style prefix
extendDOM(els) Extend DOM to include shortcut functions. [external]
	//DOMMethod() Instance of generic extendDOM.
	getMatrix(transform, x, y, browser) Returns the matrix or style of one rule.
		[parseRule] If input is string, sends it to parseRule.
		transform(el, transform, matrix, origin) Applies transform in real browsers.
			ieTransform(el,entries,h,w) Applies transform in IE.
parseStyles() Parse Stylesheets. [external]
	loadStylesheets() Load stylesheets for parsing [parent]
		parse(css,sheet) parse one stylsheet.
			stripComments(content, type) Remove comments from stylesheets. [parent]
			parseRule(rule, browser) Parses -moz-transform stylerules. Returns the matrix/style of multiple rules.
				[getMatrix]
	ieLoop() Loop through all IE styles. [parent]
		loopMethod(el,rule) Adds parsed rule to stylesheet. Instance of generic ieLoop.
			[parseRule]
convert() [parent]

4. To Do:
Convert should take percentages, inches, and everything else.
Reflections, etc. should be supported.
Any requests?
*/