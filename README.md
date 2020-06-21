# webfont-usage-analyzer

Highlight Parts of the Page Where Specific WebFonts are Used

This bookmarklet parses CSS, Resource Timing and DOM to associate WebFont URLs with FontStacks. Real more about it in [this blog post](https://paulcalvano.com/index.php/2017/07/25/performance-and-usage-implications-of-custom-fonts/)


Based on work from [here](https://gist.github.com/macbookandrew/f33dbbc0aa582d0515919dc5fb95c00a/).


To use, 

1. You need to disable CORS in a new browser session in order for the script to be able to access cssRules.  This can be done by using the `--disable-web-security` flag in Chrome. **It should go without saying, but you should only do this for testing and close the insecure browser session once you are done!**
   (command line examples for different OS's are [here](https://alfilatov.com/posts/run-chrome-without-cors/))

2. paste following into the into the JS Console or create a bookmarklet:

```
var script = document.createElement('script'); script.src='https://cdn.jsdelivr.net/gh/paulcalvano/webfont-usage-analyzer@master/Font_Analysis.js'; document.body.appendChild(script);

```
