sap.ui.define([
    "./BaseController",
    "sap/m/MessageToast"],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast) {
        "use strict";

        return Controller.extend("sap.lib.create.createbooks.controller.CreateBook", {
            onInit: function () {

            },
            onCreatePress: async function () {
                /* Books */
                const title = this.getView().byId("bookTitle")
                    .getValue()
                    .trim();
                const subtitle = this.getView().byId("bookSubtitle")
                    .getValue()
                    .trim();
                const image = this.getView().byId("bookImage")
                    .getValue()
                    .trim();
                const description = this.getView().byId("bookDescription")
                    .getValue()
                    .trim();
                const publishDate = this.getView().byId("bookPublishDate")
                    .getValue();

                /* Authors */
                let authors_IDs = [];
                let authors = this.getView().byId("bookAuthors")
                    .getValue()
                    .trim();

                if (authors !== ""){
                    authors = authors
                    .split(';')
                    .forEach( async (author) => {
                        author = author.trim();
                        await $.ajax({
                            url: `http://localhost:4004/service/books/Authors`,
                            method: 'POST',
                            contentType: "application/json",
                            data: JSON.stringify({
                                "name": author
                            })
                        }).done( (res) => {
                            console.log(res);
                            authors_IDs.push(res.ID);
                        });
                    });
                }

                /* Categories */
                let categories_IDs = [];
                let categories = this.getView().byId("bookCategories")
                    .getValue()
                    .trim();

                if (categories !== ""){
                    categories = categories
                    .split(';')
                    .forEach( async (category) => {
                        category = category.trim();
                        await $.ajax({
                            url: `http://localhost:4004/service/books/Categories`,
                            method: 'POST',
                            contentType: "application/json",
                            data: JSON.stringify({
                                "name": category
                            })
                        })
                        .done( (res) => {
                            categories_IDs.push(res.ID);
                        });
                    });
                }
                    
                /* Editors */
                let editors_ID;
                const editors = this.getView().byId("bookEditors")
                    .getValue()
                    .trim();

                if (editors === ""){
                    editors_ID = null;
                }
                else{
                    await $.ajax({
                        url: `http://localhost:4004/service/books/Editors`,
                        method: 'POST',
                        contentType: "application/json",
                        data: JSON.stringify({
                            "name": editors
                        })
                    })
                    .done( (res) => {
                        editors_ID = res.ID;
                    });
                }
                
                /* Books */
                let book_ID;
                if (title === "" || authors === ""){
                    MessageToast.show('Missing Required Fields');
                }
                else{
                    await $.ajax({
                        url: "http://localhost:4004/service/books/Books",
                        method: 'POST',
                        contentType: "application/json",
                        data: JSON.stringify({
                            "title": title,
                            "subtitle": subtitle,
                            "description": description,
                            "publish_date": publishDate,
                            "source": "Internal DB",
                            "image": image,
                            "editors_ID": editors_ID
                        })
                    })
                    .done((res) => {
                        console.log(res);
                        book_ID = res.ID;
                        MessageToast.show('Book Created');
                    });
                }

                /* BookAuthors */
                authors_IDs
                .forEach( async (author_ID) => {
                    await $.ajax({
                        url: `http://localhost:4004/service/books/BooksAuthors`,
                        method: 'POST',
                        contentType: "application/json",
                        data: JSON.stringify({
                            "book_ID": book_ID,
                            "author_ID": author_ID
                        })
                    });
                });

                /* BookCategories */
                categories_IDs
                .forEach( async (category_ID) => {
                    await $.ajax({
                        url: `http://localhost:4004/service/books/BooksCategories`,
                        method: 'POST',
                        contentType: "application/json",
                        data: JSON.stringify({
                            "book_ID": book_ID,
                            "category_ID": category_ID
                        })
                    });
                });

                console.log('Pressed!!');
            }
        });
    }
);
