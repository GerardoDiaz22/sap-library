sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'sap/lib/read/readbooks/test/integration/FirstJourney',
		'sap/lib/read/readbooks/test/integration/pages/BooksList',
		'sap/lib/read/readbooks/test/integration/pages/BooksObjectPage'
    ],
    function(JourneyRunner, opaJourney, BooksList, BooksObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('sap/lib/read/readbooks') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheBooksList: BooksList,
					onTheBooksObjectPage: BooksObjectPage
                }
            },
            opaJourney.run
        );
    }
);