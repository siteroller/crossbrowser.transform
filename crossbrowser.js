
var crossBrowser = new Class({
	initialize: function(){
		if (Browser.Engine.trident) this.ieLoop(); // In IE, unrecognized rules can be accessed w/o using AJAX.
		this.loadStylesheets();
    },
	
	loopstop: 0,
		
	parseVariables: {
		classes: { 
			fixed: ''
			, IE6: Browser.Engine.trident && Browser.Engine.version < 5
			, embedded: []
		}
		, regexs: {
			filter: Browser.Engine.version == 4 ? 'filter' : '-ms-filter'
			, progid: ': progid:DXImageTransform.Microsoft.'
			, prefix: '(?:^|})([^{]+)[^}]+'
			, rgba: 'background(?:-color)?\\s*:\\s*rgba\\s*\\(([^)]+)' //fix for: 'background: none rgba(1,1,1,1)...'
			, gradient: 'background(?:-image)?\\s*:\\s*-moz-(linear|radial)-gradient\\s*\\(\\s*([^)]+)\\)' //fix for: 'background: none -moz-linear-gradient(1,1,1,1)...'
			, corners: '-moz-border-radius(?:-(bottom|top)(left|right))?([^;}]+)'
			, transform: '-moz(-transform[^;}]+)'
			, transition: '-moz(-transition[^;}]+)'
			, shadow: '-moz(-box-shadow[^;}]+)'
		}
	},
	
	parse: function(css,sheet){
		
		sheet = document.styleSheets[sheet];
		var styles = '', style, parts, rule, add
			, self = this
			, regexs = this.parseVariables.regexs
			, classes = this.parseVariables.classes
			, loopstop = this.loopstop;
		
		// Fix transparent background colors in IE
		if (Browser.Engine.trident){
			rule = new RegExp(regexs.prefix + regexs.rgba, 'gi');
			while (style = rule.exec(css)){
				if (++loopstop > 50) {alert('bg transparency loop stopped'); return false;}
				
				parts = style[2].trim().split(/\s*,\s*/);
				parts = Math.floor(parts.pop() * 255).toString(16) + parts.map(function(val){
					return (+(val > 9) && '') + val;
				}).join('');
				add = regexs.filter + regexs.progid + 'gradient(startColorstr=#' + parts + ', endColorstr=#' + parts + ')';
				sheet.addRule(style[1],add,0);
			}
		}
		
		// Fix Border Radii
		rule = new RegExp(regexs.prefix + regexs.corners, 'gi');
		while (style = rule.exec(css)){
			if (++loopstop > 40) { alert('Border Radii loop stopped!'); return false; }
			switch (Browser.Engine.name){
				case 'webkit': sheet.insertRule(style[1] + '{-webkit-border-' + (style[2] ? style[2] + '-' + style[3] + '-' : '') + 'radius' + style[4] + '}',0); break;
			}
		}
		
		// Fix box shadow
		rule = new RegExp(regexs.prefix + regexs.shadow, 'gi');
		while (style = rule.exec(css)){
			if (++loopstop > 40) { alert('Box Shadow loop stopped!'); return false; }
			switch (Browser.Engine.name){
				case 'webkit': sheet.insertRule(style[1] + '{-webkit' + style[2] + '}',0); break;
				case 'opera' : sheet.insertRule(style[1] + '{' + style[2] + '}',0); break;
				case 'trident':
					// Will generate another element to serve as the shadow.  Either a blurred element, or a VML one for the round corners.
			}
		}
		
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
		
		// Fix gradients
		rule = new RegExp(regexs.prefix + regexs.gradient, 'gi');
		while (style = rule.exec(css)){
			var trim = /^\s*|\s*(,)\s*|\s*$/g
				, match = style[3].replace(trim,'$1').split(',')
				, start = match.shift()
				, from = match.shift()
				, to = match.pop();
				
			switch (Browser.Engine.name){
				case 'webkit':
					var reverse = /([^\s]+)\s+([^\s]+)/g
						, opposite = {top:'bottom', bottom:'top', left:'right', right:'left'};

					add = style[1] + '{' + 'background-image:-webkit-gradient({style},{start},{end},from({from}),to({to}){stops})}'.substitute({
						style: style[2]
						, start: (start.contains(' ') ? '' : 'center ') + start  
						, end: 'center ' + opposite[start]
						, from: from
						, to: to
						, stops: (!match.length ? '' : ',color-stop(' + 
							match.map(function(stop){
								return stop.replace(reverse,'$2, $1');
							}).join('), color-stop(') + ')')
					});
					sheet.insertRule(add,0);
					break;
				case 'trident':
					
					var from = match.shift()
						, to = match.pop();
						
					if (!match.length) styles += style[1] + '{' +'{filter}{progid}gradient(startColorstr=#{from}, endColorstr=#{to})'.substitute({
						filter: regexs.filter
						, progid: regexs.progid
						, from: from
						, to: to
					}) + '}';
					break;
			}
		}
	},
	
	ieBorder: function (div, arc){
		// Based on script by Remiz Rahnas <http://www.htmlremix.com> and Nick Fetchak <http://fetchak.com/ie-css3>
		//alert('div:'+div+'\narc:'+arc);
		
		// Update VML when page is resized
		function updateSize(){}
		window.addEvent('resize', updateSize);
		
		// IE8 VML namespace
		if (!document.namespaces.v) document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
		var vml = document.createStyleSheet();
		['roundrect', 'fill'].each(function(shape){
			vml.addRule('v\\:' + shape, 'behavior: url(#default#VML)');
		});
		
		// Dimensions
		var parent = div.getOffsetParent() || document.body
			, size = div.getCoordinates()
			, pos = parent.getPosition && parent.getPosition()||{}//relative to page, otherwise would get styles: left etc.
			, stroke = div.getStyle('stroke-weight') || 0
			, bg = div.getStyles('background-color', 'border-color', 'border-width')
			, fillSrc = div.getStyle('background-image').replace(/^url\("(.+)"\)$/, '$1')
		
		// Remove background and borders from element. This will not work in IE6, use padding or some other workaround.
		div.setStyles({background:'transparent', borderColor:'transparent'});
		
		var rect = new Element('v:roundrect', {
			'class': 'vstroke'
			, arcsize: '.07' // parseInt(arc / Math.min(this.offsetWidth, this.offsetHeight), 1)
			, stroked: !!stroke
			, strokeColor: stroke ? bg['border-color'] : bg['background-color']
			, strokeWeight: stroke
			, styles: {
				display: 'block'
				, antialias: true
				, zIndex: div.zIndex - 1
				, position: 'absolute'
				, top:   size.top //stroke / 2 + size.top - pos.top
				, left: size.left //stroke / 2 + size.left - pos.left
				, width: size.width - stroke
				, height: size.height - stroke
				, filter: ''//border_opacity && (div.opacity < 1) 
				//	? 'progid:DXImageTransform.Microsoft.Alpha(Opacity='+ parseFloat(div.opacity * 100) + ')'
				//	: ''
			}
		}).inject(parent);
		
		var fill = new Element('v:fill', {
			color: stroke ? bg['border-color'] : bg['background-color']
			, type: 'tile'
			, src: fillSrc
			, 'class': 'vfill'
			, opacity: div.opacity
		}).inject(rect);
	},
	
	ieLoop: function(){
		var self = this, classes = this.parseVariables.classes;
		// Loop through stylesheets for styles that can be affected. IE allows access to styles it doesn't recognise.
		Array.each(document.styleSheets, function(sheet,i){
			Array.each(sheet.rules || sheet.cssRules, function(rule,j){
				// IE6 position:fixed
				if (rule.style.position == 'fixed' && classes.IE6){
					document.styleSheets[i].rules[j].style.position = 'absolute';
					classes.fixed += ',' + rule.selectorText;
				};
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
	
	loadStylesheets: function(){
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
				// From http://james.padolsey.com/javascript/javascript-comment-removal-revisted.  First one is used in cssSandpaper
				// 2nd regex looks like it will cough on regex's with '/*', but claims it works, should be rewritten.
				content = content.replace(/\/\/.+?(?=\n|\r|$)|\/\*[\s\S]+?\*\//g, '').replace(/@[^\{\};]*;|@[^\{\};]*\{[^\}]*\}/g, '');
				//content = content.replace(/(/\*[\u0000-\uFFFF]*?(?=\*\/)\*/|//[^\u000A|\u000D|\u2028|\u2029]*)/, '');
			break;
			case 'htm':
				// to remove first tag, huh? Have copied it till I can think about it.
				content = content.replace(/<!--|-->/, '');
			break;
		}
		return content;
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

});

window.addEvent('domready', function(){
	new crossBrowser();
	// alert(typeof $$('[style*=width]')[0]); Absolutely nothing doing in IE6.  Must try with the new selector engine in Mootools 1.3
});

function crossReplace(){
	
	// ToDo: border-image, text-shadow
	// Function to convert em's, %, etc to pixels.  Function to find VML support.
	
	function parseReplace(css,sheet){
		style = style.replace(gradient, function(match){
			//...
		}).replace(/-moz-/g, '-webkit-');

		document.styleSheets[sheet].cssText = style;
	}
	
	//$$('head style').each(function(stylesheet){
	//	var style = stylesheet.get('html');
	/*var filter = Browser.Engine.version == 4 ? 'filter' : '-ms-filter'
				, progid = ': progid:DXImageTransform.Microsoft.'
				, rgba = /}([^{]+)[^}]+background(?:-color)?\s*:\s*rgba\s*\(([^)]+)/gi // /}([^{]+)[^}]+rgba\s*\(([^)]+)/gi
		
			

			, gradient = /-moz-(linear|radial)-gradient\s*\(\s*([^)]+)\)/gi;
				, styles = ''
				, style;
			//css.match(/<style[^<]+<\/style/g).each(function(tag){
			//if (tag.contains('rgba')){
			// http://stackoverflow.com/questions/844001/javascript-regex-and-submatches	
		if (Browser.Engine.webkit){
			//webkit {rotation, box-shadow, border-radius: (moz->webkit), gradient: replace}
			
			var trim = /^\s*|\s*(,)\s*|\s*$/g
				, reverse = /([^\s]+)\s+([^\s]+)/g
				, gradient = /-moz-(linear|radial)-gradient\s*\(\s*([^)]+)\)/gi;
			
			style = style.replace(gradient, function(match){
				var match = arguments[2].replace(trim,'$1').split(',')
				, start = match.shift()
				, opposite = {top:'bottom', bottom:'top', left:'right', right:'left'}
				, result = "-webkit-gradient({style},{start},{end},from({from}),to({to}){stops})".substitute({
					style: arguments[1]
					, start: (start.contains(' ') ? '' : 'center ') + start  
					, end: 'center ' + opposite[start]
					, from: match.shift()
					, to: match.pop()
					, stops: (!match.length ? '' : ',color-stop(' + 
							match.map(function(stop){
								return stop.replace(reverse,'$2, $1');
							}).join('), color-stop(') + ')' )
				});
				return result;
			}).replace(/-moz-/g, '-webkit-');
			stylesheet.set('html',style);
			//will not correctly handle: angles in FF, two start directions (must it reverse them?  How should opposites run? percentages [no webkit support, calculate it!])
		} else if(Browser.engine.trident){
			var classes = '';
			Array.each(documents.stylesheets, function(sheet){
				*//* If only IE support is needed
				sheet.cssText.split('fixed').each(function(fix){
					var begin = fix.lastIndexOf('}');
					classes += fix.substr(begin + 1 ? begin : 0).split('{')[0] + ',';
				})
				*//*
				// All browsers:
				
			});
			
			
		}
	})*/
}