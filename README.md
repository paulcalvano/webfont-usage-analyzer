# webfont-usage-analyzer

Parses CSS, Resource Timing and DOM to associate WebFont URLs with FontStacks. 
Highlights Parts of the Page Where Specific WebFonts are Used

Based on work from [here](https://gist.github.com/macbookandrew/f33dbbc0aa582d0515919dc5fb95c00a/).


To use, paste this into the JS Console or create a bookmarklet:

```javascript
var script = document.createElement('script'); script.src='https://rawgit.com/paulcalvano/webfont-usage-analyzer/master/Font_Analysis.js'; document.body.appendChild(script);
```