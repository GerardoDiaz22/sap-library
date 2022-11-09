const cds = require('@sap/cds');
const axios = require('axios');

const { Books, Editors, Authors, Categories, BooksAuthors, BooksCategories } = cds.entities('sap.lib.books');

module.exports = cds.service.impl(async function() {
    /* Books */
    this.on('READ', 'Books', async (req, next) => {
        
        /* Check for filters */
        if (req._queryOptions != undefined){
            // TODO: mejora esta logica que esta forzada -> podrias hacer una funcion??
            const { $filter } = req._queryOptions;
            const filterQueries = typeof $filter == 'undefined' ? {} : 
            Object.fromEntries(
                $filter
                .split(/ and /)
                .map( str => {
                    return str
                    .split(/\seq|'/)
                    .filter( item => !!item.trim() );
                })
            );

            const reqQuery = ( query ) => {
                if (query.SELECT.hasOwnProperty('where')){
                    const { where, limit, ...rest } = query.SELECT;
                    return { SELECT : rest };
                }
                return query;
            };

            const dbRes = await cds.run(reqQuery(req.query));
            
            if (Array.isArray(dbRes)){
                const tableRes = dbRes.filter( book => {
                    let isValid;
                    let myRegex;
                    if(filterQueries.authors_field){
                        isValid = false;
                        myRegex = new RegExp(filterQueries.authors_field, "i");
                        for (let i = 0; i < book.authors.length; i++) {
                            if (myRegex.test(book.authors[i].author.name)){
                                isValid = true;
                            }
                        }
                        if( isValid == false )
                            return false;
                    }
                    if(filterQueries.editors_field){
                        myRegex = new RegExp(filterQueries.editors_field, "i");
                        if (!myRegex.test(book.editors.name))
                            return false;
                    }
                    if(filterQueries.categories_field){
                        isValid = false;
                        myRegex = new RegExp(filterQueries.categories_field, "i");
                        for (let i = 0; i < book.categories.length; i++) {
                            if (myRegex.test(book.categories[i].category.name)){
                                isValid = true;
                            }
                        }
                        if( isValid == false )
                            return false;
                    }
                    return true;
                });
                tableRes.$count = tableRes.length;

                if (!tableRes.length){
                    /* Query */
                    const { $search } = req._queryOptions;

                    let googleQuery = '';
                    if ($search){
                        googleQuery += `intitle:${$search}`;
                    }
                    if (filterQueries.authors_field){
                        googleQuery += `inauthor:${filterQueries.authors_field}`;
                    }
                    if (filterQueries.editors_field){
                        googleQuery += `inpublisher:${filterQueries.editors_field}`;
                    }
                    if (filterQueries.categories_field){
                        googleQuery += `subject:${filterQueries.categories_field}`;
                    }
                    if (filterQueries.description){
                        googleQuery += `indescription:${filterQueries.description}`;
                    }
                    const googleRes = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${googleQuery}?&maxResults=40`);
                    if (googleRes.data.items == undefined){
                        return [{}];
                    }else{
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
        
                            subtitle = (typeof subtitle == 'undefined') ? '' : subtitle;
                            description = (typeof description == 'undefined') ? '' : description;
                            publish_date = (typeof publish_date == 'undefined') ? '' : publish_date;
        
                            const entryBook = { title, subtitle, description, publish_date, image, source, editors_ID };
                            await cds.create( Books, entryBook );
                            const book_ID = await cds.read( Books, { title } ).then( data => data.ID );
                            console.log(book_ID);
                            
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
                            setTimeout( () => {
                                resolve(cds.run(reqQuery(req.query))
                                .then( data => {
                                    return data.filter( book => {
                                        let isValid;
                                        let myRegex;
                                        if(filterQueries.authors_field){
                                            isValid = false;
                                            myRegex = new RegExp(filterQueries.authors_field, "i");
                                            for (let i = 0; i < book.authors.length; i++) {
                                                if (myRegex.test(book.authors[i].author.name)){
                                                    isValid = true;
                                                }
                                            }
                                            if( isValid == false )
                                                return false;
                                        }
                                        if(filterQueries.editors_field){
                                            myRegex = new RegExp(filterQueries.editors_field, "i");
                                            if (!myRegex.test(book.editors.name))
                                                return false;
                                        }
                                        if(filterQueries.categories_field){
                                            isValid = false;
                                            myRegex = new RegExp(filterQueries.categories_field, "i");
                                            for (let i = 0; i < book.categories.length; i++) {
                                                if (myRegex.test(book.categories[i].category.name)){
                                                    isValid = true;
                                                }
                                            }
                                            if( isValid == false )
                                                return false;
                                        }
                                        return true;
                                    });
                                })
                                .then( data => {
                                    data.$count = data.length;
                                    return data;
                                }));
                              }, 1000);
                        });
                    }
                }
                else{
                    return tableRes;
                }
            }
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
        const authRes = await cds.read( Authors, { name } );
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

    /* Books Authors*/
    this.on('DELETE', 'BooksAuthors', async (req, next) => {
        const book_ID = req.params[0];
        const bookAuthRes = await SELECT.from( BooksAuthors ).where({ book_ID })
        bookAuthRes.forEach( async entry => {
            await cds.delete(BooksAuthors, entry.ID);
        });
    });

    /* Books Categories */
    this.on('DELETE', 'BooksCategories', async (req, next) => {
        const book_ID = req.params[0];
        const bookCatRes = await SELECT.from( BooksCategories ).where({ book_ID })
        bookCatRes.forEach( async entry => {
            await cds.delete(BooksCategories, entry.ID);
        });
    });
});