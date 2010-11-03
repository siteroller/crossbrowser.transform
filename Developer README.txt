Developer Info:
0. We want your help. 
If you are good at math, code, or putting things through their paces, fork and hack! 

1. Yup, we put commas first. Haskell style.
For some perspective, read the comments:
	http://ajaxian.com/archives/is-there-something-to-the-crazy-comma-first-style
	http://gist.github.com/357981
	http://github.com/tibbe/haskell-style-guide/blob/master/haskell-style.md

2. Yeah, we really did define ieTransform just to overwrite it using .implement.
#1 is based on totalitarianism's concepts, and provides a smoother result for animations in IE.
It will also allow the stylesheet to be amended instead of the element.
But I have not been able to work out setting the origin. Yet.
#2 is based on Dylan's math, and works.
If you can work out #1, we'll put your name in lights!

3. Function Map:
Transform: Element Transformation Class 
initialize() Set browser-specific style prefix
extendDOM(els) Extend DOM to include shortcut functions. [external]
	//DOMMethod() Instance of generic extendDOM.
	getMatrix(transform, x, y, browser) Returns the matrix or style of one rule.
		[parseRule] If input is string, sends it to parseRule.
		transform(el, transform, matrix, origin) Applies transform in real browsers.
			ieTransform(el,entries,h,w) Applies transform in IE.
			convert(value) converts length values to unitless pixel values (12px -> 12)

CrossBrowser.Transform: Apply Transforms To Stylesheets.
parseStyles() Parse Stylesheets. [external]
	loadStylesheets() Load stylesheets for parsing. [CrossBrowser Class]
		parse(css,sheet) parse one stylsheet. [CrossBrowser Class]
			stripComments(content, type) Remove comments from stylesheets. [CrossBrowser Class]
			parseRule(rule, browser) Parses -moz-transform stylerules. Returns the matrix/style of multiple rules.[Transform Class]
				parseObj: Array of styles to find, methods to apply.
				[getMatrix]
	ieLoop() Loop through all IE styles. [CrossBrowser Class]
		loopMethod(el,rule) Adds parsed rule to stylesheet. Instance of generic ieLoop.
			[parseRule]
convert() [parent]

4. To Do:
Convert should take percentages, inches, and everything else.
Reflections, etc. should be supported.
Any requests?


5. Some more credits:
stripComments (not actually used in the end :)) based on 
	http://james.padolsey.com/javascript/javascript-comment-removal-revisted, linked to in cssSandpaper.
Transform Matricis from Wikipedia - http://en.wikipedia.org/wiki
	/Matrix_(mathematics)
	/Linear_transformation
	/Transformation_matrix
Fancy Matrix multiplication based on the theory at http://easycalculation.com/matrix
	/learn-matrix-multiplication.php
	/matrix-multiplication.php