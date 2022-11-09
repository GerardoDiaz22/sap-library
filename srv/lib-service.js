const cds = require('@sap/cds');
const axios = require('axios');

const { Books, Editors, Authors, Categories, BooksAuthors, BooksCategories } = cds.entities('sap.lib.books');

module.exports = cds.service.impl(async function() {
    this.on('READ', 'Books', async (req, next) => {
        const dbRes = await cds.run(req.query);

        if (!dbRes.length && req._queryOptions != undefined){
            const { $search } = req._queryOptions;
            let googleQuery = '';
            if ($search){
                googleQuery += `intitle:${$search}`;
            }
            const googleRes = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${googleQuery}?&maxResults=40`);
            const bookRes = googleRes.data.items
            .forEach( async book => {
                let {
                    title, subtitle, authors, description, categories, imageLinks,
                    publisher: editors,
                    publishedDate: publish_date,
                    ...rest
                } = book.volumeInfo;
                
                /* Source */
                const source = 'Google Books';
                
                /* Cover */
                const image = ( typeof imageLinks == 'undefined') ? '' : imageLinks.thumbnail;
                
                /* Editors */
                editors = ( typeof editors == 'undefined') ? 'Unknown' : editors;
                const editors_ID = await cds.read( Editors, { name: editors } )
                .then( async data => {
                    if (!data){
                        await cds.create( Editors, { name: editors } );
                        return await cds.read( Editors, { name: editors } );
                    }
                    /**
                     * El id podria obtenerse con el resultado del create anterior pero la respuesta es un objeto muy complejo
                     * TODO: buscar un metodo en el cookbook para manejarlo o una función mejor
                     */
                    return data;
                })
                .then( data => {
                    return data.ID;
                })
                .catch( err => {
                    throw err;
                });

                /* Authors */
                authors = ( typeof authors == 'undefined') ? [] : authors;
                let authors_ID = [];
                for (let i = 0; i < authors.length; i++) {
                    let resID = await cds.read( Authors, { name: authors[i] } )
                    .then( async data => {
                        if (!data){
                            await cds.create( Authors, { name: authors[i] } );
                            return await cds.read( Authors, { name: authors[i] } );
                        }
                        return data;
                    })
                    .then( data => {
                        return data.ID;
                    })
                    .catch( err => {
                        throw err;
                    });
                    authors_ID.push(resID);
                }

                /* Categories */
                categories = (typeof categories == 'undefined') ? [] : categories;
                let categories_ID = [];
                for (let i = 0; i < categories.length; i++) {
                    let resID = await cds.read( Categories, { name: categories[i] } )
                    .then( async data => {
                        if (!data){
                            await cds.create( Categories, { name: categories[i] } );
                            return await cds.read( Categories, { name: categories[i] } );
                        }
                        return data;
                    })
                    .then( data => {
                        return data.ID;
                    })
                    .catch( err => {
                        throw err;
                    });
                    categories_ID.push(resID);
                }

                /* Books */
                const entryBook = { title, subtitle, description, publish_date, image, source, editors_ID };
                await cds.create( Books, entryBook );
                const book_ID = await cds.read( Books, { title } ).then( data => data.ID );
                
                /* BooksAuthors */
                authors_ID.forEach( async author_ID => {
                    await cds.create( BooksAuthors, { book_ID, author_ID } );
                });

                /* BooksCategories */
                categories_ID.forEach( async category_id => {
                    await cds.create( BooksCategories, { book_ID, category_id } );
                });
            });
            return await new Promise( (resolve, reject) => {
                setTimeout(() => {
                    resolve(cds.run(req.query));
                  }, 1000);
            });
        }
        return next();
    });

    /* Editors */
    this.on('CREATE', 'Editors', async (req, next) => {
        const { name } = req.data;
        const editRes = await cds.read( Editors, { name } )
        if (editRes){
            return req.reply(editRes);
        }
        return next();
    });

    /* Authors */
    this.on('CREATE', 'Authors', async (req, next) => {
        const { name } = req.data;
        const authRes = await cds.read( Authors, { name } )
        if (authRes){
            return req.reply(authRes);
        }
        return next();
    });

    /* Categories */
    this.on('CREATE', 'Categories', async (req, next) => {
        const { name } = req.data;   
        const catRes = await cds.read( Categories, { name } )
        if (catRes){
            return req.reply(catRes);
        }
        return next();
    });
});