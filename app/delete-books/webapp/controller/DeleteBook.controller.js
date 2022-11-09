sap.ui.define([
    "./BaseController",
    "sap/m/MessageToast"],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast) {
        "use strict";
        
        return Controller.extend("sap.lib.delete.deletebooks.controller.DeleteBook", {
            onInit: function () {

            },
            onDeletePress: function () {
                const bookID = this.getView().byId("bookID")
                .getValue()
                .trim();
                console.log(bookID);
                if (bookID){
                    $.ajax({
                        url: `http://localhost:4004/service/books/Books(${bookID})`,
                        method: 'DELETE'
                    })
                    .done( res => {
                        MessageToast.show('Book Deleted');
                    });
                }
            }
        });
    });
