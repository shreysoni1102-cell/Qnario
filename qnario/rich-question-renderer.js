// Helper utility to render questions with rich content (equations, images, etc)

export function renderQuestion(question) {
    const container = document.createElement('div');
    container.className = 'question-display';

    // If question has HTML content (from uploaded docs), use it
    if (question.html) {
        container.innerHTML = `
            <div class="question-content">
                ${question.html}
            </div>
        `;
    } else {
        // Plain text fallback
        container.innerHTML = `
            <div class="question-content">
                <p>${question.text}</p>
            </div>
        `;
    }

    return container;
}

export function renderOptions(question, selectedAnswer = null) {
    const container = document.createElement('div');
    container.className = 'options-display';

    question.options.forEach((option, index) => {
        const label = document.createElement('label');
        label.className = 'option-label';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `question_${question.id}`;
        radio.value = option;
        radio.checked = selectedAnswer === option;
        
        const text = document.createElement('span');
        text.textContent = option;
        
        label.appendChild(radio);
        label.appendChild(text);
        container.appendChild(label);
    });

    return container;
}

export function setupMathDisplay() {
    // Load MathJax if questions contain equations
    if (window.MathJax) {
        MathJax.typesetPromise().catch(err => console.log('MathJax error:', err));
    }
}

export function getStyles() {
    return `
        <style>
            .question-display {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .question-content {
                font-size: 16px;
                line-height: 1.6;
                color: #1e293b;
            }

            .question-content p {
                margin: 10px 0;
            }

            .question-content img {
                max-width: 100%;
                height: auto;
                margin: 15px 0;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
            }

            .question-content h3,
            .question-content h4 {
                margin-top: 15px;
                margin-bottom: 10px;
            }

            .options-display {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-top: 20px;
            }

            .option-label {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 12px;
                background: white;
                border: 2px solid #e2e8f0;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s;
                user-select: none;
            }

            .option-label:hover {
                border-color: #3b82f6;
                background: #f0f9ff;
            }

            .option-label input[type="radio"] {
                margin-top: 2px;
                cursor: pointer;
                accent-color: #3b82f6;
            }

            .option-label input[type="radio"]:checked + span {
                font-weight: 600;
                color: #3b82f6;
            }

            .option-label span {
                flex: 1;
                font-size: 15px;
                line-height: 1.4;
            }

            /* MathJax styling */
            .MathJax {
                font-size: 18px !important;
            }

            .MJX-TEX {
                font-family: 'STIX Two Math', serif !important;
            }
        </style>
    `;
}
