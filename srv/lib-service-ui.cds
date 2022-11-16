using LibService from './lib-service';

annotate LibService.Books with {
    title           @title: 'Title';
    subtitle        @title: 'Subtitle';
    description     @title: 'Description';
    source          @title: 'Source';
    image           @title: 'Cover'     @UI.IsImageURL : true;
    editors         @title: 'Editors'   @UI.Hidden;
    publish_date    @title: 'Publication Date';
    ID              @title: 'ID';
}

annotate LibService.Books with {
    authors_field       @title: 'Author(s)';
    editors_field       @title: 'Editor(s)';
    categories_field    @title: 'Categories';
}

annotate LibService.Editors with {
    name           @title: 'Editor(s)';
}

annotate LibService.Authors with {
    name           @title: 'Author(s)';
}

annotate LibService.Categories with {
    name           @title: 'Categories';
}

annotate LibService.Books with @(
    UI: {
        HeaderInfo : {
			TypeName        : 'Book',
			TypeNamePlural  : 'Books',
            Title           : { Value : title },
            Description     : { Value : subtitle },
            ImageUrl        : image,
            TypeImageUrl    : 'sap-icon://course-book'
        },
        HeaderFacets : [
            {
                $Type  : 'UI.ReferenceFacet',
                Label  : '',
                Target : '@UI.FieldGroup#Header',
            },
        ],
        SelectionFields : [
            authors_field,
            editors_field,
            categories_field
        ],
        LineItem : [
            {
                Value : title,
                @UI.Importance : #High
            },
            {
                Value : subtitle,
                @UI.Importance : #High
            },
            {
                Value : authors.author.name,
                @UI.Importance : #High
            },
            {
                Value : editors.name,
                @UI.Importance : #High
            },
            {
                Value : categories.category.name,
                @UI.Importance : #Medium
            },
            {
                Value : publish_date,
                @UI.Importance : #High
            },
            {
                Value : description,
                @UI.Importance : #Low
            },
            {
                Value : image,
                @UI.Importance : #High
            },
            {
                Value : authors_field,
                ![@UI.Hidden]
            },
            {
                Value : editors_field,
                ![@UI.Hidden]
            },
            {
                Value : categories_field,
                ![@UI.Hidden]
            }
        ],
        Facets: [
            {
                $Type  : 'UI.ReferenceFacet',
                ID : 'aboutBook',
                Label  : 'About',
                Target : '@UI.FieldGroup#About'
            },
            {
                $Type  : 'UI.ReferenceFacet',
                ID : 'bibBook',
                Label  : 'Bibliography',
                Target : '@UI.FieldGroup#Bib'
            }
		],
        FieldGroup#Header: {
			Data: [
                {
                    $Type : 'UI.DataField',
                    Label : 'Author(s)',
                    Value : authors.author.name,
                    // BUG: no display de los autores, pero solo en el header, en el content si sirves
                },
                {
                    $Type : 'UI.DataField',
                    Label : 'Editor(s)',
                    Value : editors.name,
                },
                {
                    $Type : 'UI.DataField',
                    Label : 'Publication Date',
                    Value : publish_date,
                },
                {
                    $Type : 'UI.DataField',
                    Label : 'ID',
                    Value : ID,
                }
			]
		},
		FieldGroup#About: {
			Data: [
                {
                    $Type : 'UI.DataField',
                    Value : description
                },
				{
                    $Type : 'UI.DataField',
                    Value : categories.category.name
                }
			]
		},
		FieldGroup#Bib: {
			Data: [
                {
                    $Type : 'UI.DataField',
                    Value : source
                },
                {
                    $Type : 'UI.DataField',
                    Value : createdAt
                },
                {
                    $Type : 'UI.DataField',
                    Value : modifiedAt
                }
			]
		}
    }
) {}

annotate LibService.Books with {
    editors @(
		Common: {
			Text: editors.name,
            TextArrangement: #TextOnly
		}
	);
    description @UI.MultiLineText: true;
}

annotate LibService.BooksAuthors with {
    author @(
        title: 'Authors',
        Common: {
            Text: author.name, TextArrangement: #TextOnly
        }
    );
    book @(
        title: 'Books',
        Common: {
            Text: author.name, TextArrangement: #TextOnly
        }
    );
}