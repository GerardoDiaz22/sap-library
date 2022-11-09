using { sap.lib.books as my } from '../db/schema';

@path: 'service/books'
service LibService {
    entity Books as projection on my.Books;
    entity Authors as projection on my.Authors;
    entity Categories as projection on my.Categories;
    entity Editors as projection on my.Editors;
    entity BooksAuthors as projection on my.BooksAuthors;
    entity BooksCategories as projection on my.BooksCategories;
}