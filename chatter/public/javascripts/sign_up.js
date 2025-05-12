(function () {
    'use strict';

    // Constants
    const submit = $('#submitButt');
    const password = $('#password');
    const passwordConfirm = $('#passwordConfirm');
    const checkbox = $('#passwordCheckBox');
    const username = $('#username');
    const displayName = $('#displayName');
    const email = $('#email');
    const securityQ = $('#securityQ');
    const allInputs = $('input');

    let submittedFlag = false;
    let runSubmit = true;

    // Event Binding
    allInputs.on('focus', validateOnHoverClick).on('input', validateOnHoverClick).on('blur', defaltBorder);
    submit.on('click', validate);
    checkbox.on('click', togglePasswordVisibility);

    // Toggle Password Visibility
    function togglePasswordVisibility() {
        const type = checkbox.prop('checked') ? 'text' : 'password';
        password.attr('type', type);
        passwordConfirm.attr('type', type);
    }

    // Validation Functions
    function validate(e) {
        e.preventDefault();
        submittedFlag = true;
        runSubmit = true;

        testUsername() ? onSubmitSuccess(username) : onSubmitFail(username);
        testDisplayName() ? onSubmitSuccess(displayName) : onSubmitFail(displayName);
        testPassword() ? onSubmitSuccess(password) : onSubmitFail(password);
        testEmail() ? onSubmitSuccess(email) : onSubmitFail(email);
        testSecurityQ() ? onSubmitSuccess(securityQ) : onSubmitFail(securityQ);
        password.val() === passwordConfirm.val() && passwordConfirm.val() ? onSubmitSuccess(passwordConfirm) : onSubmitFail(passwordConfirm);
        if(runSubmit)
        $('form').submit();
    }

    // Validation Tests
    function testUsername() {
        const isValidLength = testLength(username);
        const isValidCapital = testCapital(username);
        const isValidLower = testLower(username);
        const hasNoSpacesResult = hasNoSpaces(username);

        return isValidLength && isValidCapital && isValidLower && hasNoSpacesResult;
    }

    function testDisplayName() {
        const isValidLength = testLength(displayName);
        const isValidCapital = testCapital(displayName);
        const isValidLower = testLower(displayName);

        return isValidLength && isValidCapital && isValidLower;
    }

    function testPassword() {
        const isValidLength = testLength(password, 8);
        const isValidCapital = testCapital(password);
        const isValidLower = testLower(password);
        const hasNumber = testNumber(password);
        const hasNoSpacesResult = hasNoSpaces(password);

        return isValidLength && isValidCapital && isValidLower && hasNumber && hasNoSpacesResult;
    }

    function testSecurityQ() {
        const isValidLower = testLower(securityQ);
        const isValidUpper = testCapital(securityQ);

        if (isValidLower || isValidUpper) {
            $('.hasText').css('background-color', 'rgb(245, 240, 240)');
            return true;
        }
        $('.hasText').css('background-color', 'rgba(255, 0, 0, 0.1)');
        return false;
    }

    function testEmail() {
        const text = email.val();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidLength = testLength(email, 0, 320);
        const isEmailPattern = emailPattern.test(text);
        let emailWarningcontainer = $('#emailWarningcontainer');

        if (!isValidLength || !isEmailPattern) {
            if (submittedFlag) {
                emailWarningcontainer.show();

                if (!isEmailPattern) emailWarningcontainer.find('.validEmail').show().css('background-color', 'rgba(255, 0, 0, 0.1)');
                if (!isValidLength) emailWarningcontainer.find('.length').show().css('background-color', 'rgba(255, 0, 0, 0.1)');
            }
        }
        if (isEmailPattern) emailWarningcontainer.find('.validEmail').css('background-color', 'rgb(245, 240, 240)');
        if (isValidLength) {
            emailWarningcontainer.find('.length').hide();
            if ($('.validEmail').is(':hidden')) {
                emailWarningcontainer.hide();
            }
        }

        return isValidLength && isEmailPattern;
    }

    // Input Validation Styles
    function applyErrorStyles(input) {
        input.css({
            'border-color': 'rgb(240, 29, 29)',
            'box-shadow': '0 0 5px rgba(240, 61, 29, 0.5)'
        });
        if (submittedFlag) onSubmitFail(input);
    }

    function applySuccessStyles(input) {
        input.css({
            'border-color': 'rgb(29, 240, 110)',
            'box-shadow': '0 0 5px rgba(29, 240, 82, 0.9)'
        });
        if (submittedFlag) onSubmitSuccess(input);
    }

    function defaltBorder(event) {
        const input = $(event.target);
        input.css({
            'box-shadow': 'inset 1px 1px 3px rgba(0, 0, 0, 0.1)',
            'border': '1px solid #ccc'
        });
    }

    function onSubmitFail(input) {
        runSubmit = false;
        input.css('background-color', 'rgba(255, 0, 0, 0.1)');

        input.on('mouseenter', () => {
            input.css('background-color', 'rgba(255, 0, 0, 0.3)');
        }).on('mouseleave', () => {
            input.css('background-color', 'rgba(255, 0, 0, 0.1)');
        });
    }

    function onSubmitSuccess(input) {
        input.css('background-color', 'rgba(0, 255, 42, 0.1)');

        input.on('mouseenter', () => {
            input.css('background-color', 'rgba(0, 255, 42, 0.3)');
        }).on('mouseleave', () => {
            input.css('background-color', 'rgba(0, 255, 42, 0.1)');
        });
    }

    // Input Validation on Events
    function validateOnHoverClick(event) {
        const input = $(event.target);
        const inputID = input.attr('id');

        if (inputID === 'passwordCheckBox') return;

        if (!input.val()) {
            input.css({
                'border-color': 'rgb(29, 163, 240)',
                'box-shadow': '0 0 5px rgba(29, 163, 240, 0.5)'
            });
            return;
        }

        switch (inputID) {
            case 'username':
                testUsername() ? applySuccessStyles(input) : applyErrorStyles(input);
                break;
            case 'displayName':
                testDisplayName() ? applySuccessStyles(input) : applyErrorStyles(input);
                break;
            case 'password':
                testPassword() ? applySuccessStyles(input) : applyErrorStyles(input);
                break;
            case 'passwordConfirm':
                password.val() === passwordConfirm.val() && passwordConfirm.val() ? applySuccessStyles(input) : applyErrorStyles(input);
                break;
            case 'email':
                testEmail() ? applySuccessStyles(input) : applyErrorStyles(input);
                break;
            case 'securityQ':
                testSecurityQ() ? applySuccessStyles(input) : applyErrorStyles(input);
                break;
        }
    }

    // Utility Functions
    function testLength(input, min = 6, max = 20) {
        const text = input.val();
        const isValid = text.length >= min && text.length <= max;

        if (!isValid) {
            if (submittedFlag) {
                input.siblings('div').find('.length').css('background-color', 'rgba(255, 0, 0, 0.1)');
            }
            return false; // Invalid length
        } else if (submittedFlag) {
            input.siblings('div').find('.length').css('background-color', 'rgb(245, 240, 240)');
        }

        return true; // Valid length
    }

    function testCapital(input) {
        const text = input.val();
        const hasUpperCase = /[A-Z]/.test(text);

        if (!hasUpperCase) {
            if (submittedFlag)
                input.siblings('div').find('.upperCase').css('background-color', 'rgba(255, 0, 0, 0.1)');
            return false; // No uppercase letter
        } else if (submittedFlag) {
            input.siblings('div').find('.upperCase').css('background-color', 'rgb(245, 240, 240)');
        }

        return true; // Valid uppercase
    }

    function testLower(input) {
        const text = input.val();
        const hasLowerCase = /[a-z]/.test(text);

        if (!hasLowerCase) {
            if (submittedFlag)
                input.siblings('div').find('.lowerCase').css('background-color', 'rgba(255, 0, 0, 0.1)');
            return false; // No lowercase letter
        } else if (submittedFlag) {
            input.siblings('div').find('.lowerCase').css('background-color', 'rgb(245, 240, 240)');
        }

        return true; // Valid lowercase
    }

    function testNumber(input) {
        const text = input.val();
        const hasNumber = /[0-9]/.test(text);

        if (!hasNumber) {
            if (submittedFlag)
                input.siblings('div').find('.number').css('background-color', 'rgba(255, 0, 0, 0.1)');
            return false; // No number
        } else if (submittedFlag) {
            input.siblings('div').find('.number').css('background-color', 'rgb(245, 240, 240)');
        }

        return true; // Valid number
    }

    function hasNoSpaces(input) {
        const text = input.val();

        if (/\s/.test(text)) {
            if (submittedFlag)
                input.siblings('div').find('.noSpace').css('background-color', 'rgba(255, 0, 0, 0.1)');
            return false; // Contains spaces
        } else if (submittedFlag) {
            input.siblings('div').find('.noSpace').css('background-color', 'rgb(245, 240, 240)');
        }

        return true; // No spaces
    }

})();
