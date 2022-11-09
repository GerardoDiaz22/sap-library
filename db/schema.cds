namespace sap.lib.books;
using { managed, cuid } from '@sap/cds/common';

// Source es un campo que puede ser implementado con un enum string.
// ref: https://blogs.sap.com/2022/06/22/use-enum-values-in-your-cap-service-implementation/

// El campo authors de Books es una composition, por tanto comparte el ciclo de vida con su asociación en BooksAuthors
// Si un Book es borrado, tmb su entrada en BooksAuthors

// Campos como authors y publish_date podrian manejarse con defaults con valores como 'Anonymous' o $now pero es mejor manejarlo en el backend

entity Books : cuid, managed {
    title        : localized String;
    subtitle     : localized String;
    authors      : Composition of many BooksAuthors on authors.book = $self;
    categories   : Composition of many BooksCategories on categories.book = $self;
    editors      : Association to Editors;
    publish_date : String;
    description  : String;
    image        : String;
    source       : String;
}

/* Many-to-many */
entity BooksAuthors : cuid {
    book        : Association to Books;
    author      : Association to Authors;
}

entity Authors : cuid {
    name        : String;
    books       : Association to many BooksAuthors on books.author = $self;
}

/* Many-to-many */
entity BooksCategories : cuid {
    book        : Association to Books;
    category    : Association to Categories;
}

entity Categories : cuid {
    name        : localized String;
    books       : Association to many BooksCategories on books.category = $self;
}


/* One-to-Many */
entity Editors : cuid {
    name        : String;
    book        : Association to many Books on book.editors = $self;
}