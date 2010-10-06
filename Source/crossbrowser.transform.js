/*
Credits: 
stripComments based on http://james.padolsey.com/javascript/javascript-comment-removal-revisted, linked to in cssSandpaper.


*/

var CrossBrowser = new Class({
	initialize: function(){
		//if (Browser.Engine.trident) this.ieLoop(); // In IE, unrecognized rules can be accessed w/o using AJAX.
		this.loadStylesheets();
    }
	
	, loopstop: 0
	
	, loadStylesheets: function(){
		var self = this;
		$$('style').each(function(el,i){
			self.parse(el.get('html'),i);
		});
		$$('link[rel=stylesheet]').each(function(el,i){
			//switch to regex to catch case insensitive domain name changes
			if (href.contains('://') && href.contains(document.domain)) new Request({onSuccess:self.parse});
		});
	},

	stripComments: function(content, type){
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
});

CrossBrowser.implement({

	parseVariables: {
		classes: {
			fixed: ''
			, IE6: Browser.Engine.trident && Browser.Engine.version < 5
			, embedded: []
		}
		, regexs: {
			filter: Browser.Engine.version == 4 ? 'filter' : '-ms-filter'
			, transform: '-moz(-transform[^;}]+)'
			, transition: '-moz(-transition[^;}]+)'
		}
	},
	
	parse: function(css,sheet){
		
		sheet = document.styleSheets[sheet];
		var add, rule, parts, style, styles = '' 
			, self = this
			, regexs = this.parseVariables.regexs
			, classes = this.parseVariables.classes
			, loopstop = this.loopstop;
		
		// Fix transitions [-moz-transition, -moz-transition-property, -moz-transition-duration, -moz-transition-timing-function, -moz-transition-delay]
		rule = new RegExp(regexs.prefix + regexs.transition, 'gi');
		while (style = rule.exec(css)){
			if (++loopstop > 40) { alert('Transitions loop stopped!'); return false; }
			switch (Browser.Engine.name){
				case 'webkit': sheet.insertRule(style[1] + '{-webkit' + style[2] + '}'); break;
			}
		}
		
		// Fix transforms
		rule = new RegExp(regexs.prefix + regexs.transform, 'gi');
		while (style = rule.exec(css)){
			switch (Browser.Engine.name){
				case 'webkit':
					// FF takes a <length> tx & ty matrix value; webkit takes unitless <number>s: https://developer.mozilla.org/En/CSS/-moz-transform
					// This function removes the '%','em','px' etc. doesn't convert it to pixels. Yet.
					style[2] = style[2].replace(/(matrix\s*\((?:\s*[-\.\d]+\s*,){4})(\s*\d+)[^,]*,(\s*\d+)[^)]*\)/gi, '$1$2,$3)');
					document.styleSheets[0].insertRule(style[1] + '{-webkit' + style[2] + '}'); 
					break;
			}
		}
		
	},
	
	ieLoop: function(){
		var self = this, classes = this.parseVariables.classes;
		// Loop through stylesheets for styles that can be affected. IE allows access to styles it doesn't recognise.
		Array.each(document.styleSheets, function(sheet,i){
			Array.each(sheet.rules || sheet.cssRules, function(rule,j){
				// IE border-radius
				var pos = rule.style['moz-border-radius'];
				if (pos) $$(rule.selectorText).each(function(el){ self.ieBorder(el,pos) });
				pos = rule.style['moz-transform'];
				if (pos) $$(rule.selectorText).each(function(el){ self.ieTransform(el,pos) });
				// -moz-transform: matrix, rotate, scale, scaleX, scaleY, skew, skewX, skewY, translate, translateX, translateY
				// While ALL of these can be done using matrix, it may be simpler to do the three translations using regular javascript.
			});
		});
		
		// Must query elements for styles on element instead of in stylesheet. [ToDo: Test!]
		classes.fixed = classes.fixed.substr(1);
		if (classes.IE6 && (classes.fixed2 = $$('[style*=fixed]')) || classes.fixed){
			// Concept - http://ryanfait.com/position-fixed-ie6
			var ss = document.createStyleSheet(), height = 'height:100%; overflow:auto';
			ss.addRule('html', height); ss.addRule('body', height);
			new Element('div',{
				styles:{width:'100%',position:'relative',height:'100%',overflow:'auto'}
			}).adopt($$('body>*')).inject(window.document.body);
			var styleEls = $$(classes.fixed).combine(classes.fixed2).each(function(el){
				el.inject(document.body);
			});
		};
	},
	
	
	
	ieTransform: function(el,rule){
		var style, entries, reg = /([^(]+)\(([^)]*)\)/gi;
		function toRadians(deg){ return (deg - 360) * Math.PI / 180; }
		
		el.setStyle('background-color','red');
		if (el.getStyle('position') == 'static') el.setStyle('position','relative');
		
		while (style = reg.exec(rule)){
			switch (style[1].trim().toLowerCase()){
				case 'matrix':
					var a = style[2].split(/\s*,\s*/);
					entries = [a[0], a[1], a[2], a[3], parseFloat(a[5]), parseFloat(a[5])]; // 4 & 5 Should be processed from length values to pixels.
				break;
				case 'rotate':
					var angle = style[2].match(/([.0-9]+)deg/i)[1]
					, cos = Math.cos(angle)
					, sin = Math.sin(angle);
					entries = [cos, sin, -sin, cos, 0, 0];
				break;
				
				case 'scale':
					entries = [sx, 0, 0, sy, 0, 0]
				case 'scalex':
				case 'scaley': break;
				
				case 'skew':
				case 'skewx':
				case 'skewy': break;
				
				case 'translate':
					entries = [1, 0, 0, 1, TX, TY];
				break;
				case 'translatex':
				case 'translatey': break;
			}
			this.ieMatrix(el, entries);
		}
	},
	
	ieMatrix: function(el,entries,h,w){
	//ieMatrix: function(el,a,b,c,d,e,f,h,w){
		// Based on http://extremelysatisfactorytotalitarianism.com/blog/?p=922#theCode
		if (!h){
			var size = el.getCoordinates();
			h = size.height / 2;
			w = size.width / 2;
			x = size.left;
			y = size.top;
		}
		
		// linear transforms via Matrix Filter, adjusted for -transform-origin [ToDo: Is now hard set to center.]
		var matrix = a + ', M21=' + b + ', M12=' + c + ', M22=' + d
			, filter = 'progid:DXImageTransform.Microsoft.Matrix(M11=' + matrix + ', SizingMethod="auto expand")'
			, sx = Math.abs(c) * h + (Math.abs(a) - 1) * w
			, sy = Math.abs(b) * w + (Math.abs(d) - 1) * h;

		// translation. Rounding doesn't fully eliminate integer jittering.
		el.setStyles({
			left: Math.round(x + e - sx)
			, top: Math.round(y + f - sy)
			, filter: filter
			, height: 200
			, width: 200
			//, '-ms-filter': filter
		});
	}
	
	,rotate: function(angle, origin){
		var rad = angle * Math.PI / 180
			, cos = Math.cos(rad)
			, sin = Math.sin(rad)
			, a = cos
			, b = -sin
			, c = sin
			, d = cos;
		
		this.element.setStyle('filter', 'progid:DXImageTransform.Microsoft.Matrix(M11={a}, M12={b}, M21={c}, M22={d}, SizingMethod="auto expand")'.substitute({a:a,b:b,c:c,d:d}));
		var originMarker = new Element('div',{styles:{position:'absolute', width:3, height:3, 'background-color':'red', top:origin.y-1, left:origin.x-1, 'line-height':1, overflow:'hidden'}}).inject(this.element);
		origin = origin || {x:0,y:0};
		
		//result *= matrix; [origin.x,origin.y]	* [[a,c],[b,d]]
		var centerX = this.element.clientWidth / 2 - origin.x
			, centerY = this.element.clientHeight / 2 - origin.y
			, cx = centerX * a + centerY * b + origin.x
			, cy = centerX * c + centerY * d + origin.y;
						
		this.element.style.top += cy - this.element.offsetHeight / 2;
		this.element.style.left += cx - this.element.offsetWidth / 2;
	}	
	
});

window.addEvent('domready', function(){
	new CrossBrowser();
});