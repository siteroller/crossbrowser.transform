CrossBrowser.Transform
===========

Hassle free transforms for every browser!
No dependencies. Super light (Transform.js < 4KB). 

Includes two classes:

### Transform:

Methods for rotating, skewing, scaling, and more.  
Extends the DOM to make these available to every element.

### CrossBrowser.Transform

Parse all stylesheets and silently correct any transforms it finds.

![Screenshot](https://github.com/siteroller/crossbrowser.transform/raw/develop/Demo/screenshots/rotate1.png)

How to use
----------

1. Include Mootools and CrossBrowser.Transform.js  

        <script src='Mootools.js'></script>  
        <script src='CrossBrowser.Transform.js'></script>
2. Create an instance of the class.  

        var transform = new CrossBrowser.Transform();
3. Fix stylesheets.
stylesheets - (element selector): Stylesheet to fix. Optional, defaults to all except those with the class of 'non-crossbrowser'.  
        
		transform.parseStyles([stylesheets]);
        // Fixes 
		<style type='text/css'>
           .turn { 
              -moz-transform:rotate(135deg) translate(12px); 
              -moz-transform-origin:50px 50px
           } 
        </style>
4. AND/OR Extend the DOM with methods described below.
elements - (element selector). Elements to extend. Optional, defaults to all.  

        transform.extendDOM([elements]);   
        $('myElement').rotate(45); // rotates element 45 degrees.

### DOM Methods

Elements are extended with the following methods:  

* __transform__(style [, origin])<br>
  style - (string). CSS3 style containing any number of rules. [Mozilla/W3C Syntax](https://developer.mozilla.org/en/CSS/-moz-transform).  
  eg: `$('el').transform('rotate(45deg) translate(30%)')`;
* __rotate__(angle [, origin])  
  angle - (number). Degrees the element should be turned clockwise.  
  eg: `$('el').rotate(45);`
* __skew__(xAxis [, yAxis][, origin])  
  xAxis - (number). Degrees element should be skewed from its vertical axis.  
  yAxis - (number). Degrees skewed from horizontal axis. Defaults to 0.  
  eg: `$('el').skew(45,45);`
* __skewX__(xAxisAngle [, origin])
* __skewY__(yAxisAngle [, origin])
* __scale__(width [, height][, origin])  
  width - (number). Scale applied to element's width.  
  height - (number). Scale applied to height.  Defaults to width.  
  eg: `$('el').scale(2);`
* __scaleX__(widthPercentage [, origin])  
  Height scale defaults to 0.
* __scaleY__(heightPercentage [, origin])
* __translate__(left [, top][, origin])  
  left - (value). Distance element should be moved from left.  
  top - (value). Distance element should be moved from top.  Defaults to 0.  
  eg: `$('el').scale('50%');`
* __translateX__(left [, origin])
* __translateY__(top [, origin])
* __matrix__(matrix [, origin])  
  matrix - (array). Matrix to be applied. Array must have 4-6 values, where elements are listed vertically:  
  a c e  
  b d f  
  eg: `$('el').scale([1,0,0,1,1,0]);`

All methods accept an optional argument:  
origin - (array): An [x,y] coordinate to use as the elements origin.  
eg: `$('el').rotate(45, [50,50]);`
  
There are other transforms such as reflection that may work, but no guarantees for now.

If you do not need to fix stylesheets, you can include and call the Transform class directly:

        <script src='Compressed/transform.js'></script>
		new Transform().extendDOM();
        $('myElelement').rotate(45)...
		
Screenshots
-----------

![Matrix](https://github.com/siteroller/crossbrowser.transform/raw/develop/Demo/screenshots/matrix1.png)
![Skew](https://github.com/siteroller/crossbrowser.transform/raw/develop/Demo/screenshots/skew1.png)
![Rotate](https://github.com/siteroller/crossbrowser.transform/raw/develop/Demo/screenshots/rotate1.png)

## Community
The Transform was devised as part of the [CrossBrowser.js project](http://siteroller.net/404).

We aim to create a lightweight and easy method to fix stylesheets, and let developers focus on coding!! 

Issues? Ideas? Wanna Join? [We need help!]


 - Open threads regarding the transform class on the [CrossBrowser Google Group](http://groups.google.com/group/crossbrowser).
 - Watch the [GitHUB page](https://github.com/siteroller/crossbrowser.transform/) for updates.
 - Leave issues on the [GitHUB Issue Tracker](https://github.com/siteroller/crossbrowser.transform/issues).
 - Check out the [Mootools Forge Page](http://mootools.net/forge/p/crossbrowser.transform).  
    - As I have no control over the state of the forge page, the info and downloads on this page may be out of date.
 - Or email us:

        var name = "CrossBrowser.Transform";
        var company = "siteroller.net";
        var email = name + '@' + company;
        // There's gotta be a better way to keep spammers at bay, no?!

## Issues
* External stylesheets are not parsed in Webkit and Opera.  
They *are* in IE, which is good, because that is the main offender. :)
* No support for older version of Firefox < 3.5 or IE9 Beta.  
IE9 support will come as soon as you buy me a computer which supports it!
		
Special thanks to [Buriel Webwerx](http://burielwebwerx.com/) for their help with the website!
