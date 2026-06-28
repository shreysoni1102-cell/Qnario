/**
 * Extracts and formats a user-friendly error message from a failed API call.
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

/**
 * Returns a friendly, actionable error message specifically for the Syllabus Scanner.
 * Translates raw technical AI/network errors into plain language the teacher can understand.
 * @param {object} err - The error object from Axios.
 * @returns {string} A user-friendly message with guidance.
 */
export const getSyllabusErrorMessage = (err) => {
    const raw =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        '';
    const lower = raw.toLowerCase();

    // AI quota / rate limit errors
    if (lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted') || lower.includes('rate limit')) {
        return '⏳ The AI service is temporarily busy (rate limit reached). Please wait 30 seconds and try scanning again.';
    }

    // Timeout errors
    if (lower.includes('timeout') || lower.includes('etimedout') || lower.includes('econnaborted')) {
        return '⏱️ The scan is taking too long. Your PDF may be very large. Try again — it usually works on a second attempt.';
    }

    // Network / server unreachable
    if (lower.includes('network') || lower.includes('econnrefused') || lower.includes('enotfound') || err.code === 'ERR_NETWORK') {
        return '🔌 Cannot reach the AI service right now. Please check your internet connection and try again.';
    }

    // AI returned bad/unparseable content
    if (lower.includes('non-json') || lower.includes('parse') || lower.includes('json')) {
        return '📄 The AI couldn\'t extract topics cleanly from this file. Try re-uploading the PDF, or make sure the file is a clear, readable syllabus.';
    }

    // PDF/file reading errors
    if (lower.includes('pdf') || lower.includes('file') || lower.includes('extract')) {
        return '📑 Couldn\'t read your file properly. Make sure you\'re uploading a valid PDF or Word document.';
    }

    // Generic 500 / server errors
    if (err.response?.status === 500 || lower.includes('server error')) {
        return '🛠️ Something went wrong on the server. Please try again in a moment.';
    }

    // Generic 503 / service unavailable
    if (err.response?.status === 503 || lower.includes('unavailable')) {
        return '🔄 The AI service is restarting (cold start). Please wait 30–60 seconds and try again.';
    }

    // Fallback — still better than raw technical error
    if (raw) {
        return `❌ Scan failed: ${raw} — Please try again or re-upload your file.`;
    }

    return '❌ Syllabus scanning failed. Please try again. If the problem persists, re-upload your file.';
};
