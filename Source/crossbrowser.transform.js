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
				if (pos) $$(rule.selectorText).each(function(el){ self.ieTransform(el,pos) });
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

CrossBrowser.implement({
	
	parseStyles:function(){
		if (Browser.ie) ieLoop(); // Only IE reads unrecognized styles.
		else if (!Browser.firefox) loadStylesheets(); // FF doesn't need parsing. No External Stylesheets.
	}
	, parse: function(css,sheet){
		sheet = document.styleSheets[sheet];
		var style, rule = new RegExp(regexs.prefixes + '-moz(-transform[^;}]+)', 'gi');
		
		while (style = rule.exec(css)){
			// Remove the '%','em','px' from tx & ty. FF uses <length>, webkit [and opera?] use unitless <number>s: https://developer.mozilla.org/En/CSS/-moz-transform
			if(Browser.safari || Browser.chrome)
				style[2] = style[2].replace(/(matrix\s*\((?:\s*[-\.\d]+\s*,){4})(\s*\d+)[^,]*,(\s*\d+)[^)]*\)/gi, '$1$2,$3)');
			document.styleSheets[0].insertRule(style[1] + '{' + this.pre + style[2] + '}');
		}
	}
	, ieTransform: function(el,rule){
		// Converts a -moz-transform style into an IE filter.
		var style
			, matrix = [0,0,0,0,0,0]
			, reg = /([^(]+)\(([^)]*)\)/gi;

		while (style = reg.exec(rule)){
			var transform = style[1].trim()
				, t = style[2].split(/\s*,\s*/).map(this.convert)
				, entries = transform == 'matrix' ? t : this.getMatrix(transform, t[0], t[1]); 
			matrix = Object.map(matrix, function(n, i){ return n + entries.i });
		}
		document.styleSheets[0].insertRule(style[1], this.ieMatrix(el, matrix)); // ieMatrix should be reworked to return a matrix to apply.
	}
	, transformer: function(el, transform, tx, ty, origin){
		if (typeOf(ty) == 'array'){ origin = ty; ty = null; }  //console.log(el, transform, this.getMatrix(transform, tx, ty, this.pre));
		this.transform(el, transform, this.getMatrix(transform, tx, ty, this.pre), origin);
		return this;
	}
	, getMatrix: function(transform, x, y, browser){
		
		var t = transform.toLowerCase()
			, unit = {c:'', k:'deg', r:'px', o:'deg'}[t.substr(1,1)]
		if (browser) return x + unit + (y ? ',' + y + unit : '');
		
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
		} else if (t == 'skew'){
			x = (x * rad).tan();
			y = (y * rad).tan() || 0;
		} else if (!y) y = rep ? x : 0;

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
	, initialize: function(){
		this.pre = {chrome:'-webkit',safari:'-webkit', opera:'-o',firefox:'-moz'}[Browser.name];
	}
	, transform: function(el, transform, matrix, origin){
		if (!this.pre) return this.ieMatrix2(el, matrix, origin);
		origin = origin || [50,50];
		if (el.getStyle('position') == 'static') el.setStyle('position','relative');
		el.setStyle(this.pre + '-transform', transform + '(' + matrix + ')');
		el.setStyle(this.pre + '-transform-origin', origin[0] + 'px ' + origin[1] + 'px');
	}
	, ieMatrix2: function(el, matrix, origin){
		origin = origin || [50,50];
		el.setStyle(
			Browser.ie6 ? 'filter' : '-ms-filter',
			'progid:DXImageTransform.Microsoft.Matrix(M11={a}, M12={c}, M21={b}, M22={d}, SizingMethod="auto expand")'.substitute({a:matrix[0],b:matrix[1],c:matrix[2],d:matrix[3]})
		);
		
		var x = el.clientWidth / 2 - origin[0]
			, y = el.clientHeight / 2 - origin[1];
		
		el.style.left = x * matrix[0] + y * matrix[2] + origin[0] + matrix[4] - el.offsetWidth / 2;
		el.style.top =  x * matrix[1] + y * matrix[3] + origin[1] + matrix[5] - el.offsetHeight / 2;
		
		if (false) var originMarker = new Element('div',{styles:{position:'absolute', width:3, height:3, 'background-color':'red', top:origin[0]-1, left:origin[1]-1, 'line-height':1, overflow:'hidden'}}).inject(el);
	}
	, ieMatrix: function(el,entries,h,w){
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
	, extendElements: function(els){
		var self = this
			, methods = ['transform','matrix','rotate','skew','skewX','skewY','scale','scaleX','scaleY','translate','translateX','translateY'];
	
		methods.each(function(method){
			var f = function(tx, ty){
				self.transformer(this, method ,tx, ty);//, self
				return this;
			};
			if (els) els.each(function(el){
				el[method] = f;
			}); else {
				var hash = {};
				hash[method] = f;
				Element.implement(hash);
			}
		});
		//this.els = els || '';
	}
});

window.addEvent('domready', function(){
	//new CrossBrowser().rotate($('rot'),25).rotate($('rot'),45,[0,0]).translate($('rot'),50).scaleX($('rot'),2).skewY($('rot'),35)//;
	//var a = new CrossBrowser($$('div')).transformer($('rot'),'rotate',25).transformer($('rot'),'rotate',45).transformer($('rot'),'scaleX', 2).transformer($('rot'),'skew',35);
	var a = new CrossBrowser();
	a.extendElements($$('#rot'));
	$('rot').rotate(75).scaleX(2);
});
