In /Users/Jesper.Forrest.Hustad/Documents/helsearbeidsgiver-inntektsmelding/apps/joark
is our current inntektsmelding PDF design.

There are tests there that define multiple different scenerios and ensures the PDF looks like expected



Our new designs have been made in figma and implemented via a HTML to PDF creations tool.
THey are here /Users/Jesper.Forrest.Hustad/Documents/helsearbeidsgiver-pdfgen
There are some basic tests, but it uses a openHTMLtoPDF tool so it must use older HTML.



The figma designs are visualized with a title descrbing the situation the design shows.
The json data which exists that will be converted to this design.
The actual design PDF.


You job is to now go trough the old kotlin code and the tests there and from the data create a list of unique scenerios that must be implemented.

Write it in /Users/Jesper.Forrest.Hustad/Desktop/im-design-figma/copilot_llm_notes.md you are free to write continously there as needed.
For each situation you will generate a fitting json for that situation in /Users/Jesper.Forrest.Hustad/Desktop/im-design-figma/inntektsmelding_handlebars_work

I will review the list you make. Then you will create a html page which will be fully imported by me into figma.
/Users/Jesper.Forrest.Hustad/Desktop/im-design-figma/figma-design
So you will need to design it in the manner i described the figma designs need to be.

To create this html page you will use the folder
/Users/Jesper.Forrest.Hustad/Desktop/im-design-figma/inntektsmelding_handlebars_work
to generate a handlebars template that you run with a npm script you will generate.
This way you are programatically reliable converting the json into the design.

So after you have done all that you will be ready to create a new script in figma-design folder that programatically and reliable takes the json and the html design and title descripting the situation represented and creates one single long big html page. WHich i then can import into figma.

Use npm and node for the temp scripts you need to make. I want you to do this via scripts so that you are programatically and realiably creating stuff instead of manually writing the HTML repeatingly again and again by hand.

Try to split each of these tasks into subtasks.
Remember your context limits. Refer back to this markdown file if you ever get lost as i have described everything you need to do. Remember to write down in the copilot llm notes file if there are important data etc you need to save. Be very carefull when looking at /Users/Jesper.Forrest.Hustad/Documents/helsearbeidsgiver-inntektsmelding/apps/joark as its part of a monorepo so there is no need to analyze the whole project, basically everything should be avaialble there. You may have to look at /Users/Jesper.Forrest.Hustad/Documents/hag-domene-inntektsmelding to see how the json should be formatted and how the inntektmelding looks like.

Try to whenever possible test your output and ensure what you have made is working and looks correct etc.

Remember your design should match the other designs in helsearbeidsgiver-pdfgen so create it in the same style. This is all just a part of the design process so ensure it just looks good and correct.