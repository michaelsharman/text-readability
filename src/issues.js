import nlp from 'compromise';
import speechPlugin from 'compromise-speech';
import * as metrics from './metricsUtil';

nlp.plugin(speechPlugin);

export function checkSentenceLength(s, grade) {
    const doc = nlp(s);
    const sentences = doc.sentences().out('array');
    let results = {
        long: [],
        complex: [],
    };
    let checkWordsLength, checkComplexWords, checkSyllableCount;

    if (grade <= 2) {
        checkWordsLength = 10;
        checkComplexWords = 1;
        checkSyllableCount = 2;
    } else if (grade <= 5) {
        checkWordsLength = 12;
        checkComplexWords = 1;
        checkSyllableCount = 2;
    } else if (grade <= 8) {
        checkWordsLength = 20;
        checkComplexWords = 2;
        checkSyllableCount = 2;
    } else if (grade <= 12) {
        checkWordsLength = 25;
        checkComplexWords = 3;
        checkSyllableCount = 3;
    } else {
        checkWordsLength = 35;
        checkComplexWords = 4;
        checkSyllableCount = 3;
    }

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const words = nlp(sentence).terms().out('array');
        // Filter words with more than three syllables
        const longWords = words.filter(word => {
            // Get the syllables for the word
            const syllables = nlp(word).syllables();
            // Flatten the array of arrays to get a single array of syllables
            const flatSyllables = syllables.flat();
            // Check if the total number of syllables exceeds a value that is grade dependent
            return flatSyllables.length > checkSyllableCount;
        });

        if (words.length > checkWordsLength) {
            results.long.push({ sentence: i + 1, words: words.length });
        }

        if (longWords.length >= checkComplexWords) {
            results.complex.push({ sentence: i + 1, words: longWords.length, detail: longWords });
        }
    }

    return results;
}

export function getIssues(str, suggestions) {
    const doc = nlp(metrics.replaceHtmlBreaks(str));
    const sentences = doc.sentences().json();
    let issuesResult = str;
    let style;
    let suggestion;
    let suggestionTitle;
    let hasComplexSuggestion;
    let hasLongSuggestion;
    let numComplexWords;
    let numLongWords;

    if (suggestions && (suggestions?.complex.length || suggestions?.long.length)) {
        sentences.forEach((sentence, index) => {
            hasComplexSuggestion = false;
            hasLongSuggestion = false;
            numComplexWords = 0;
            numLongWords = 0;
            suggestionTitle = '';
            suggestion = '';

            for (let s of suggestions.long) {
                if (s.sentence - 1 == index) {
                    hasLongSuggestion = true;
                    numLongWords = s.words;
                    break;
                }
            }

            for (let s of suggestions.complex) {
                if (s.sentence - 1 == index) {
                    hasComplexSuggestion = true;
                    numComplexWords = s.words;
                    break;
                }
            }

            if (hasLongSuggestion || hasComplexSuggestion) {
                style = hasLongSuggestion && hasComplexSuggestion ? 'hard' : 'medium';

                if (hasLongSuggestion && hasComplexSuggestion) {
                    suggestionTitle = 'Long and complex sentence';
                    suggestion = `This sentence has ${numComplexWords} complex word${
                        numComplexWords > 1 ? 's' : ''
                    } and is ${numLongWords} words in total. Consider refining.`;
                } else {
                    if (hasLongSuggestion) {
                        suggestionTitle = `Long sentence`;
                        suggestion = `This sentence has ${numLongWords} word${
                            numLongWords > 1 ? 's' : ''
                        }, you might consider shortening or having a balanced mix of short and long sentences for stronger engagement.`;
                    } else {
                        suggestionTitle = `Complex sentence`;
                        suggestion = `This sentence has ${numComplexWords} complex word${numComplexWords > 1 ? 's' : ''}`;
                    }
                }

                let replacement = `<span class="readability-highlight-${style}"
                    tabindex="0"
                    data-bs-toggle="popover"
                    data-bs-placement="top"
                    data-bs-custom-class="readability-popover"
                    data-bs-title="${suggestionTitle}"
                    data-bs-trigger="hover focus"
                    data-bs-content="${suggestion}"
                >`;
                let temp = sentences[index].text;
                if (suggestions?.complex) {
                    for (let detail of suggestions.complex) {
                        if (detail.sentence - 1 == index) {
                            for (let d of detail.detail) {
                                temp = temp.replaceAll(d, `<span class="readability-complex-word">${d}</span>`);
                            }
                        }
                    }
                }
                replacement += `${temp}</span>`;
                issuesResult = issuesResult.replace(sentences[index].text, replacement);
            }
        });
    }

    return issuesResult;
}
