
export default function () {
    return {
        hasNoSpaces: (text) => {
            if (/\s/.test(text))
                return false;
            return true;
        },
        hasNumber: (text) => {
            if (/[0-9]/.test(text))
                return true;
            return false;
        },
        hasLower: (text) => {
            if (/[a-z]/.test(text))
                return true;
            return false;
        },
        hasUpper: (text) => {
            if (/[A-Z]/.test(text))
                return true;
            return false;
        },
        testLength: (text, min = 6, max = 20) => {
            if (text.length >= min && text.length <= max)
                return true;
            return false;
        },
        isEmail: (text) => {
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
                return true;
            return false;
        }
    };

}



