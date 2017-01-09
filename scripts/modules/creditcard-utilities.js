/*!
 * CreditCard Utilites Jquery Plugin
 * Authors: Platform Integration, @aaron_jones@volusion.com
 */

define(["modules/jquery-mozu", "modules/jquery-creditcardvalidator"], function ($, ccValidator) {


    var CreditCardUtils = (function () {
        var validCallback = null,
            selector = '',
            $selector = '',
            isValid = false,
            isValidLength = false,
            isValidLuhn = false,

            init = function (ccselector) {
                setSelector(ccselector);
                setStringUtilites();
                setOnKeyDown();
                validate();
                setOnInput();
            },

            validate = function () {
                $selector.validateCreditCard(function (result) {
                    isValid = result.valid;
                    if (isValid && result.length_valid) {
                        onValid(result);
                    }
                });
            },

            setVaildCallback = function (callback) {
                validCallback = callback;
            },

             setSelector = function (ccselector) {
                 selector = ccselector;
                 $selector = $(ccselector);
             },

            getIsValid = function () {
                return isValid;
            },

            onValid = function (result) {
                if (validCallback !== null && validCallback !== undefined) {
                    validCallback(result);
                }
            };

        function setOnKeyDown(){
            $selector.on('keydown', function (e) {
                if (e.ctrlKey || e.shiftKey) {
                    return;
                }

                if (e.keyCode > 36 && e.keyCode < 41) {
                    return;
                }

                if (e.keyCode > 47 && e.keyCode < 58) {
                    return;
                }
                else if (e.keyCode == 8 || e.keyCode == 46) {
                    return;
                }
                e.preventDefault();
            });
        }

        function setOnInput() {
            $selector.on('input', function (input) {
                var tempInput = [],
                    inputArray = $(this).val().removeSpacesFromCC().split('');

                $.each(inputArray, function (index, value) {
                    if (value > -1 && value < 10) {
                        tempInput.push(value);
                    }
                });

                if (tempInput.length > 16) {
                    formatCCNumber(inputArray.splice(0, 16));
                    return;
                }
                formatCCNumber(tempInput);
            });
        }

        function setStringUtilites() {
            String.prototype.removeSpacesFromCC = function () {
                return this.replace(/\s/g, "");
            };
        }

        function formatCCNumber(inputArray) {
            var tempInput = inputArray;

            for (var i = 4; i < tempInput.length; i = i + 5) {
                tempInput.splice(i, 0, " ");
            }

            printCCNUmber(tempInput.join(""));
        }

        function printCCNUmber(ccNumber) {
            $selector.val(ccNumber);
        }

        return {
            isValid: getIsValid,
            init: function (selector) { init(selector); },
            validate: validate,
            onValid: function (callback) { setVaildCallback(callback); }
        };
    });

    return CreditCardUtils();

});