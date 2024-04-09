import { daleChall } from 'dale-chall';
import { syllableCount } from '@caspingus/syllable-count-english';

export function countCharacters(s) {
    return s.replace(/\s+/g, '').replace(/[^\w\s]|_/g, '').length;
}

/**
 * When calculating the Dale-Chall Readability Score, the count of difficult words should include duplicates.
 * This means that if a difficult word appears multiple times in the text, each occurrence is counted towards
 * the total number of difficult words. The rationale behind this approach is that repeated exposure to
 * difficult words within the same text contributes to the overall complexity and potentially decreases the
 * readability for the intended audience.
 * @param {string} s
 * @returns
 */
export function getDifficultWords(s) {
    const text = s.split(/[\s–—]+/);
    let words = [];

    text.forEach(element => {
        const placeholders = {
            'Mr.': 'PLACEHOLDERMR',
            'Mrs.': 'PLACEHOLDERMRS',
            'Ms.': 'PLACEHOLDERMS',
            'Dr.': 'PLACEHOLDERDR',
            'Prof.': 'PLACEHOLDERPROF',
            'St.': 'PLACEHOLDERST',
        };

        Object.keys(placeholders).forEach(abbreviation => {
            element = element.replace(new RegExp(abbreviation, 'g'), placeholders[abbreviation]);
        });

        // Step 2: Remove all unwanted characters, including periods
        element = element.replace(/[^a-zA-Z'-]/g, '');

        // Step 3: Restore the protected abbreviations back to their original form
        Object.keys(placeholders).forEach(abbreviation => {
            element = element.replace(new RegExp(placeholders[abbreviation], 'g'), abbreviation);
        });

        let word = element;
        // let word = element.replace(/[^a-zA-Z'-]/g, '');
        if (word && !isWordOrDerivativeInList(word.toLowerCase())) {
            words.push(word);
        }
    });

    return words;
}

export function countDifficultWords(s) {
    return getDifficultWords(s).length;
}

export function getParagraphs(s) {
    return s.split(/\n+/).filter(paragraph => paragraph !== '');
}

export function countParagraphs(s) {
    return getParagraphs(s).length;
}

/**
 * In the calculation of the SMOG Index, each occurrence of a polysyllabic word is counted, including duplicates.
 * The rationale is that the presence of these complex words, regardless of their repetition, contributes to the
 * text's overall readability level. The formula for the SMOG Index is designed to estimate the years of education
 * a person needs to understand a piece of writing upon first reading.
 *
 * The Gunning-Fog Index also considers polysyllabic words in its calculation, which are words with three or more
 * syllables. However, the focus is on the density of these words within the text, rather than their unique
 * occurrence. Thus, duplicates of polysyllabic words are counted in the Gunning-Fog calculation. The index
 * estimates the years of formal education a reader needs to understand the text on a first reading. The presence
 * of polysyllabic words, even if repeated, increases the complexity of the text, thereby affecting its
 * readability score.
 * @param {string} s
 * @returns
 */
export function getPolysyllables(s) {
    const text = s.split(/\s+/);
    let syllables = [];

    text.forEach(element => {
        if (syllableCount(element) > 2) {
            syllables.push(element.replace(/[^\w\s-–—]/g, ''));
        }
    });

    return syllables;
}

export function countPolysyllables(s) {
    return getPolysyllables(s).length;
}

export function countSentences(s) {
    const regexReplace = /\b(Mr|Mrs|Ms|Dr|Prof|St)\./g;
    const replacedText = s.replace(regexReplace, '$1|').replace(/"/g, '');
    const regex = /(?<=[.!?]\)?)(?=\s+[A-Z]|\s+\()/g;
    const sentences = replacedText.split(regex).filter(sentence => sentence !== '');

    return sentences.length;
}

export function countUniqueWords(s) {
    // const punctuationRegex = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
    // const words = s.split(/[\s–—]+/).reduce((accumulator, currentChar) => {
    //     return punctuationRegex.test(currentChar) ? accumulator : accumulator + currentChar;
    // }, '');
    // console.log(words);
    // return [...new Set(words)];

    // Placeholder for dashes
    const enDashPlaceholder = 'EN_DASH';
    const emDashPlaceholder = 'EM_DASH';

    // Step 1: Normalize dashes
    const normalizedText = s
        .replace(/–/g, enDashPlaceholder) // Replace en dashes
        .replace(/—/g, emDashPlaceholder) // Replace em dashes
        .toLowerCase();

    // Step 2: Remove other punctuation and normalize space
    const cleanedText = normalizedText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' '); // Remove punctuation except placeholders

    // Step 3: Split into words, considering placeholders as separate words
    const allWords = cleanedText.split(/\s+/);

    // Step 4: Deduplicate and count
    const uniqueWordsCount = allWords.reduce((acc, word) => {
        if (word !== '') {
            // Check if the word is not an empty string
            // Replace placeholders with actual dashes for final count
            const normalizedWord = word.replace(new RegExp(enDashPlaceholder, 'g'), '–').replace(new RegExp(emDashPlaceholder, 'g'), '—');

            acc[normalizedWord] = (acc[normalizedWord] || 0) + 1;
        }
        return acc;
    }, {});

    return Object.keys(uniqueWordsCount).length;
}

export function countWords(s) {
    const words = s.split(/[\s–—]+/).filter(item => item !== '');

    return words.length;
}

/**
 * Check if a word is in the Dale-Chall list or derived from a word in the list
 * @param {string} word
 * @returns
 */
function isWordOrDerivativeInList(word) {
    // Directly check if the word is in the list
    if (daleChall.includes(word)) {
        return true;
    }

    // Apply simple rules to handle common derivations
    const suffixes = ['ed', 'ing', 's', 'es', "'s"];
    for (let suffix of suffixes) {
        if (word.endsWith(suffix)) {
            let baseWord = word.substring(0, word.length - suffix.length);

            // Attempt to handle doubling consonants (e.g., "run" -> "running")
            if (suffix === 'ing' && /[aeiou][bcdfghjklmnpqrstvwxyz]$/i.test(baseWord)) {
                // Check both with and without the doubled consonant
                let baseWordSingleConsonant = baseWord.substring(0, baseWord.length - 1);
                if (daleChall.includes(baseWord) || daleChall.includes(baseWordSingleConsonant)) {
                    return true;
                }
            }
            // Special handling for "es" and "ed" which might require removing an extra character
            else if ((suffix === 'es' || suffix === 'ed') && baseWord.endsWith('i')) {
                baseWord = baseWord.substring(0, baseWord.length - 1) + 'y';
                if (daleChall.includes(baseWord)) {
                    return true;
                }
            } else if (daleChall.includes(baseWord)) {
                return true;
            }
        }
    }

    // The word or its derivatives are not in the list
    return false;
}

export function replaceHtmlBreaks(s) {
    let result = s.replace(/<br\s*\/?>/gi, '\n');
    result = result.replace(/<p>/gi, '');
    result = result.replace(/<\/p>/gi, '\n\n');

    return result;
}

export function removeHtml(s) {
    return s.replace(/<[^>]*>/g, '');
}
