/*
---
description: Class to parse stylesheets and ammend browser-specific styles as needed.
license: OSI
authors: Sam Goody siteroller@gmail.com
provides: Transform
requires: [core/1.3: '*']
credits: 
- IEMatrix functions are loosely based on: 
  - http://extremelysatisfactorytotalitarianism.com/blog/?p=922#theCode
  - http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php
...
*/
var Transform = new Class({
	
	initialize: function(){
		this.pre = {chrome:'-webkit',safari:'-webkit', opera:'-o',firefox:'-moz'}[Browser.name];
	}
	, extendDOM: function(els){
		var hash = {}
			, self = this
			, methods = ['transform','matrix','rotate','skew','skewX','skewY','scale','scaleX','scaleY','translate','translateX','translateY'];
		
		methods.each(function(method){
			hash[method] = function(x, y, origin){
				if (Type.isArray(y)) origin = y, y = null;
				var matrix = self.getMatrix(method, x, y);
				self.transform(this, method, matrix, origin);
				return this;
			};
		});
		els ? $$(els).each(function(el){Object.merge(el,hash)}) : Element.implement(hash);
		return this;
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
			scale:[x, 0, 0, y]
			, skew:[1, y, x, 1]
			, rotate:[y, x, -x, y]
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
		if (el.style.position == 'static') el.setStyle('position','relative');
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
	, parseRule: function(rule){
		// Parses -moz-transform stylerules.
		if (Browser.firefox) return rule;
		if (this.pre == '-webkit' || Browser.Opera)
			return rule.replace(/(matrix\s*\((?:[^,]+,){4})([^,]+),([^)]+)/gi, '$10,0) translate($2,$3)');
			// Move linear elements into their own rule. In Matrix, FF uses <length>, webkit [and opera?] use unitless <number>s: https://developer.mozilla.org/En/CSS/-moz-transform
		var style
			, a = [1,0,0,1,0,0]
			, reg = /([^(]+)\(([^)]*)\)/gi;
			
		while (style = reg.exec(rule)){
			var transform = style[1].trim()
				, t = style[2].split(/\s*,\s*/).map(this.convert)
				, b = this.getMatrix(transform, t[0], t[1]);
			a = [ a[1] * b[2] + a[0] * b[0]
				, a[2] * b[0] + a[3] * b[2]
				, a[0] * b[1] + a[1] * b[3]
				, a[2] * b[1] + a[3] * b[3]
				, a[0] * b[4] + a[1] * b[5] + a[4]
				, a[2] * b[4] + a[3] * b[5] + a[5]
			];
		}
		return a;
	}
	, convert: function(num,el){
		if (Type.isArray(num)) return num.map(parseFloat);
		var snum = num.trim().split(/(\d+)/);
		return parseFloat(num);
	}
});

Transform.implement({
	
	ieTransform: function(el, matrix, origin){
		origin = this.convert(origin || ['50%','50%']);
		el.setStyle(
			Browser.ie6 ? 'filter' : '-ms-filter',
			'progid:DXImageTransform.Microsoft.Matrix(M11={a}, M12={c}, M21={b}, M22={d}, SizingMethod="auto expand")'.substitute({a:matrix[0],b:matrix[1],c:matrix[2],d:matrix[3]})
		);
		
		var x = el.clientWidth / 2 - origin[0]
			, y = el.clientHeight / 2 - origin[1]
			, left = x * matrix[0] + y * matrix[2] + origin[0] + (matrix[4]||0) - el.offsetWidth / 2
			, top = x * matrix[1] + y * matrix[3] + origin[1] + (matrix[5]||0) - el.offsetHeight / 2;
		
		el.style.left = left;
		el.style.top = top;
	
		if (false) var originMarker = new Element('div',{styles:{position:'absolute', width:3, height:3, 'background-color':'red', top:origin[0]-1, left:origin[1]-1, 'line-height':1, overflow:'hidden'}}).inject(el);
	}
});