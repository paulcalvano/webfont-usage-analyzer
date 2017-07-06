// Font Usage Analyzer
// Author: Paul Calvano, Akamai Technologies
// Parses CSS, Resource Timing and DOM to associate WebFont URLs with FontStacks. 
// Allows for highlighting of font stacks correlating to WebFont URLs to examine where they are used on the page
// Based on work from https://gist.github.com/macbookandrew/f33dbbc0aa582d0515919dc5fb95c00a/ 

// Note: This is a work in progress - still working on font identification... 


var startTime = new Date().getTime();
var DEBUG=false;

// Function to resolve relative URLs by creating a HTML element and using the browser to resolve it for us... 
// https://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
function resolve(url, base_url) {		
  var doc      = document
    , old_base = doc.getElementsByTagName('base')[0]
    , old_href = old_base && old_base.href
    , doc_head = doc.head || doc.getElementsByTagName('head')[0]
    , our_base = old_base || doc_head.appendChild(doc.createElement('base'))
    , resolver = doc.createElement('a')
    , resolved_url
    ;
  our_base.href = base_url || '';
  resolver.href = url;
  resolved_url  = resolver.href; // browser magic at work here

  if (old_base) old_base.href = old_href;
  else doc_head.removeChild(our_base);
  return resolved_url;
}

// Highlight elements with the specified style
// From https://gist.github.com/macbookandrew/f33dbbc0aa582d0515919dc5fb95c00a/ 
function highlightInPage(styleId) {
    var thisNode,
        allNodes = document.body.getElementsByTagName('*'),
        nodes = document.body.querySelectorAll('[data-style-id="' + styleId + '"]');
    
    for (var i = 0; i < allNodes.length; i++) {		// remove previous highlights
        allNodes[i].classList.remove('style-highlight');
    }

    for (var i = 0; i < nodes.length; i++) {			// add highlight to specified nodes
        thisNode = nodes[i];
        thisNode.classList.add('style-highlight');
    }
}


// Clear all highlights
// From https://gist.github.com/macbookandrew/f33dbbc0aa582d0515919dc5fb95c00a/ 
function clearHighlights() {
    highlightInPage();
}

// Add blank stylesheet for highlight rule
// From https://gist.github.com/macbookandrew/f33dbbc0aa582d0515919dc5fb95c00a/ 
var sheet = (function() {
    var style = document.createElement("style");		    // Create the <style> tag
    style.appendChild(document.createTextNode(""));			// WebKit hack :(
    document.head.appendChild(style);										// Add the <style> element to the page
    return style.sheet;
})();


// Add specified CSS rule to the specified stylesheet
// From https://gist.github.com/macbookandrew/f33dbbc0aa582d0515919dc5fb95c00a/ 
function addCSSRule(sheet, selector, rules, index = 0) {
    if ("insertRule" in sheet) {
        sheet.insertRule(selector + "{" + rules + "}", index);
    } else if ("addRule" in sheet) {
        sheet.addRule(selector, rules, index);
    }
}

// add a yellow background to highlighted elements
addCSSRule(sheet, ".style-highlight", "background-color: yellow");


//  First Pass - Parse all Stylesheets and attempt to find Font Files.   Associate Font Files with Font-Family, Font-Weight, and Font-Style.
var fontCount=0;	// Number of fonts we've found.
var fonts=[];	// Array for storing Font information.


if (document.styleSheets){
  for (var s=0;s < document.styleSheets.length; s++) {					// Loop though each StyleSheet
  	if (DEBUG) console.log("Parsing StyleSheet # : " + s + ", " + document.styleSheets[s].href);
		if (document.styleSheets[s].cssRules) {			
		  var cssRules = document.styleSheets[s].cssRules.length;   // Loop trhough each CSS Rule
		  if (DEBUG) console.log("StyleSheet # : " + s + " Rule Count = " + cssRules);
		  for (var r=0;r < cssRules;r++) {					   		  	 
		  	var splitPattern=/url\(.*?\)/g;
		    var urls=document.styleSheets[s].cssRules[r].cssText.match(splitPattern);	 // Extract URLs
		    
		    // If we have a WebFont, then loop through the extracted URLs
		    if (document.styleSheets[s].cssRules[r].cssText.indexOf('@font-face') != -1 && urls) {	
		    	if (DEBUG) console.log(document.styleSheets[s].cssRules[r].cssText);													  	       
		      for (var f=0;f<urls.length;f++) {
		      	// Remove the url(" and ") part of the CSS rule.   
		        var furl = urls[f].replace("url(\"","").replace("\")","");
		;				furl = resolve(furl, document.styleSheets[s].href);		// Create a HTML element to resolve the fully qualified URL based.   
		        
		        // Match the fully qualified URLs against Resource Timing data to confirm it was loaded by the browser
						if (performance.getEntriesByName(furl).length>0) {												
							// Add Font Information to the fonts array
							fonts[fontCount]={};
							fonts[fontCount]['font-family']=document.styleSheets[s].cssRules[r].style.fontFamily;
							fonts[fontCount]['font-weight']=document.styleSheets[s].cssRules[r].style.fontWeight || "normal";
							if (fonts[fontCount]['font-weight']==400) fonts[fontCount]['font-weight']="normal";
							if (fonts[fontCount]['font-weight']==700) fonts[fontCount]['font-weight']="bold";							
							fonts[fontCount]['font-style']=document.styleSheets[s].cssRules[r].style.fontStyle || "normal" ;
							fonts[fontCount]['transferSize']=performance.getEntriesByName(furl)[0].transferSize
							fonts[fontCount]['url']=furl;
							if (DEBUG) console.log("Found " + furl + "\tfont-family: " + fonts[fontCount]['font-family'] + "\tfont-weight: " + fonts[fontCount]['font-weight'] + "\tfont-style: " + fonts[fontCount]['font-style']);		
							fontCount++;
						}
					}
		    }
		  }
		}
	}
}
//  At this point the fonts[] array will contain an index for each font file
if (DEBUG) console.log("Done Parsing CSS");													  	       
if (DEBUG) console.log(fonts);													  	       
if (DEBUG) console.log("Second Pass: Parse All DOM Elements");													  	       
    
// Second Pass - Parse all DOM elements and find computed sytles.  Correllate fonts[] array to computed styles
// Adapted from https://gist.github.com/macbookandrew/f33dbbc0aa582d0515919dc5fb95c00a/
var style,ffamily,fweight,fsize,fstyle;
var styleId;
var allStyles = [];
var nodes = document.body.getElementsByTagName('*');
var thisNode;

    
for (var i = 0; i < nodes.length; i++) {			// Loop through all Elements
	thisNode = nodes[i];
	if (thisNode.style) {
		//  Identify Font-Family, Font-Weight, and Font-Style.
		styleId = '#' + (thisNode.id || thisNode.nodeName + '(' + i + ')');
		ffamily = thisNode.style.fontFamily || getComputedStyle(thisNode, '')['font-family'];
		fweight = thisNode.style.fontWeight || getComputedStyle(thisNode, '')['font-weight'];
		fstyle = thisNode.style.fontStyle || getComputedStyle(thisNode, '')['font-style'];
            
		var urlFound=0;
		for (j=0;j<fonts.length;j++) {	// Loop through Font array we built earlier
			if (ffamily.indexOf(fonts[j]['font-family'])>=0) {  // Did we find one of the font URLs?
				if (DEBUG) console.log(ffamily + "\tMatched\t" + fonts[j]['font-family']  + "\t" + fonts[j]['font-weight'] + "\t" + fonts[j]['font-style']);				
				if (DEBUG) console.log(ffamily + "\t" + fweight + "\t" + fstyle + "\t" + fonts[j]['url']);		
				if (fweight == fonts[j]['font-weight'] && fstyle == fonts[j]['font-style']  ) {            	
					style=ffamily + "\t" + fweight + "\t" + fstyle + "\t" + fonts[j]['url'] + "\t" + fonts[j]['transferSize'];	// Matched a Font File w/ a Computed Style
					urlFound++;        
				}
			}
		}
	}
            
	// Get element’s style
	if (style) {
		if (allStyles.indexOf(style) == -1) {
			allStyles.push(style);
		}              
		thisNode.dataset.styleId = allStyles.indexOf(style);
	}
            
	// Get element:before’s style
            
	ffamily = thisNode.style.fontFamily || getComputedStyle(thisNode, ':before')['font-family'];
	fweight = thisNode.style.fontWeight || getComputedStyle(thisNode, ':before')['font-weight'];
	fstyle = thisNode.style.fontStyle || getComputedStyle(thisNode, ':before')['font-style'];
            
	var urlFound=0;
	for (j=0;j<fonts.length;j++) {
		if (ffamily.indexOf(fonts[j]['font-family'])>=0 && fweight == fonts[j]['font-weight'] && fstyle == fonts[j]['font-style']  ) {
			style=ffamily + "\t" + fweight + "\t" + fstyle + "\t" + fonts[j]['url']+ "\t" + fonts[j]['transferSize'];
			urlFound++;        
		}
	}
	
	if (style) {
	    if (allStyles.indexOf(style) == -1) {
	        allStyles.push(style);
	    }
	    // add data-attribute with key for allStyles array
	    thisNode.dataset.styleId = allStyles.indexOf(style);
	}
	
	// get element:after’s style
	ffamily = thisNode.style.fontFamily || getComputedStyle(thisNode, ':after')['font-family'];
	fweight = thisNode.style.fontWeight || getComputedStyle(thisNode, ':after')['font-weight'];
	fstyle = thisNode.style.fontStyle || getComputedStyle(thisNode, ':after')['font-style'];
	
	var urlFound=0;
	for (j=0;j<fonts.length;j++) {
		if (ffamily.indexOf(fonts[j]['font-family'])>=0 && fweight == fonts[j]['font-weight'] && fstyle == fonts[j]['font-style']  ) {
			style=ffamily + "\t" + fweight + "\t" + fstyle + "\t" + fonts[j]['url']+ "\t" + fonts[j]['transferSize'];
			urlFound++;        
		}
	}
	
	if (style) {
	    if (allStyles.indexOf(style) == -1) {
	        allStyles.push(style);
	    }
	    // add data-attribute with key for allStyles array
	    thisNode.dataset.styleId = allStyles.indexOf(style);
	}     
}

//  At this point the allStyles[] array will contain a list of all unique font stacks on the current page, and contain references to the font URLs


var endTime = new Date().getTime();
console.log ("Execution Time: " + (endTime-startTime) + " ms");

// Output Font Stacks 
var tbl = [];
for(i=0;i<allStyles.length;i++)
	tbl[i] = allStyles[i].split('\t');
console.table(tbl)
console.log("To Highlight a Font, enter the command: highlightInPage(n);\n where 'n' is the ID of the font package from the fontStacksInUse array");



