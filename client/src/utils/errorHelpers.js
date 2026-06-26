/**
 * Extracts and formats a user-friendly error message from a failed API call.
 * 
 * @param {object} err - The error object thrown by the API call (usually Axios error).
 * @returns {string} The formatted error message.
 */
export const getErrorMessage = (err) => {
    if (err.response?.data?.error) {
        return err.response.data.error;
    }
    if (err.response?.data?.message) {
        return err.response.data.message;
    }
    if (err.response?.status) {
        return `Request failed (Error ${err.response.status}). Please try again or contact support if this continues.`;
    }
    return 'Could not reach the server. Check your connection and try again.';
};
