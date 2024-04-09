import { automatedReadability } from 'automated-readability';
import { colemanLiau } from 'coleman-liau';
import { daleChallFormula, daleChallGradeLevel } from 'dale-chall-formula';
import { fleschKincaid } from 'flesch-kincaid';
import { flesch } from 'flesch';
import { gunningFog } from 'gunning-fog';
import { smogFormula } from 'smog-formula';
import { syllableCount } from '@caspingus/syllable-count-english';
import * as composition from './composition';
import * as issues from './issues';
import * as metrics from './metricsUtil';

/*
ARI: Returns a whole number that we use against a lookup table for suggested grade level.
Coleman–Liau: Round to the nearest whole number. Returns the suggested grade level.
Dale–Chall:

Notes:
We think the indices (eg SMOG) counts in other dictionaries, and the Corpus below, don't hyphenated words.
This means anything where syllables or polysyllables are calculated, our results will differ.
Eg ill-supplied and Up-to-date have 3 syllables in our results.

Used the Corpus below for testing:
https://www.commonlit.org/blog/introducing-the-clear-corpus-an-open-dataset-to-advance-research-28ff8cfea84a/
https://docs.google.com/spreadsheets/d/1sfsZhhP2umXXtmEP_NRErxLuwgN98TyH7LWOq3j07O0/edit?ref=commonlit.org#gid=971821388
*/

export function run(str, grade) {
    const s = metrics.removeHtml(metrics.replaceHtmlBreaks(str));

    const numCharacters = metrics.countCharacters(s);
    const numWords = metrics.countWords(s);
    const numUniqueWords = metrics.countUniqueWords(s);
    const numSentences = metrics.countSentences(s);
    const numParagraphs = metrics.countParagraphs(s);
    const numSyllables = syllableCount(s);
    const numPolysyllables = metrics.countPolysyllables(s);
    const numDifficultWords = metrics.countDifficultWords(s);

    const ari = automatedReadability({ sentence: numSentences, word: numWords, character: numCharacters });
    const cl = colemanLiau({ sentence: numSentences, word: numWords, letter: numCharacters });
    const daleChall = daleChallFormula({ word: numWords, sentence: numSentences, difficultWord: numDifficultWords });
    const daleChallGrade = daleChallGradeLevel(daleChall);
    const f = flesch({ sentence: numSentences, word: numWords, syllable: numSyllables });
    const fk = fleschKincaid({ sentence: numSentences, word: numWords, syllable: numSyllables });
    const gf = gunningFog({ sentence: numSentences, word: numWords, complexPolysillabicWord: numPolysyllables });
    const smog = Math.ceil(smogFormula({ sentence: numSentences, polysillabicWord: numPolysyllables }));

    const abbreviations = composition.getAbbreviations(s);
    const acronyms = composition.getAcronyms(s);
    const adverbs = composition.getAdverbs(s);
    const conjunctions = composition.getConjunctions(s);
    const hyphenated = composition.getHyphenated(s);
    const nouns = composition.getNouns(s);
    const possessives = composition.getPossessives(s);
    const prepositions = composition.getPrepositions(s);
    const pronouns = composition.getPronouns(s);

    const suggestions = issues.checkSentenceLength(s, grade);

    return {
        composition: {
            abbreviations: {
                detail: abbreviations,
                label: 'Abbreviations',
                value: abbreviations.length,
            },
            acronyms: {
                detail: acronyms,
                label: 'Acronyms',
                value: acronyms.length,
            },
            adverbs: {
                detail: adverbs,
                label: 'Adverbs',
                value: adverbs.length,
            },
            conjunctions: {
                detail: conjunctions,
                label: 'Conjunctions',
                value: conjunctions.length,
            },
            hyphenated: {
                detail: hyphenated,
                label: 'Hyphenated',
                value: hyphenated.length,
            },
            nouns: {
                detail: nouns,
                label: 'Noun and noun phrases',
                value: nouns.length,
            },
            possessives: {
                detail: possessives,
                label: 'Possessives',
                value: possessives.length,
            },
            prepositions: {
                detail: prepositions,
                label: 'Prepositions',
                value: prepositions.length,
            },
            pronouns: {
                detail: pronouns,
                label: 'Pronouns',
                value: pronouns.length,
            },
        },
        indices: {
            ari: {
                label: 'Automated Readability Index',
                detail: detailAri(Math.ceil(ari)),
                value: Math.ceil(ari),
            },
            colemanLiau: {
                label: 'Coleman–Liau',
                detail: detailColemanLiau(cl),
                value: cl.toFixed(2),
            },
            daleChall: {
                label: 'Dale-Chall Readability',
                detail: detailDaleChall(daleChall.toFixed(1)),
                value: daleChall.toFixed(1),
            },
            fleschKincaid: {
                label: 'Flesch Kincaid Grade Level',
                detail: null,
                value: fk.toFixed(2),
            },
            fleschReadingEase: {
                label: 'Flesch Reading Ease',
                detail: detailFleschReadingEase(f.toFixed(2)),
                value: f.toFixed(2),
            },
            gunningFog: {
                label: 'Gunning Fog',
                detail: detailGunningFog(gf.toFixed(2)),
                value: gf.toFixed(2),
            },
            smog: {
                label: 'SMOG Index',
                detail: detailSmog(smog.toFixed(2)),
                value: smog.toFixed(2),
            },
        },
        suggestions: {
            audit: suggestions,
            issues: issues.getIssues(str, suggestions),
        },
        metrics: {
            numCharacters: {
                label: 'Number of characters',
                detail: null,
                value: numCharacters,
            },
            numSyllables: {
                label: 'Number of syllables',
                detail: null,
                value: numSyllables,
            },
            numWords: {
                label: 'Number of words',
                detail: null,
                value: numWords,
            },
            numUniqueWords: {
                label: 'Number of unique words',
                detail: null,
                value: numUniqueWords,
            },
            numSentences: {
                label: 'Number of sentences',
                detail: null,
                value: numSentences,
            },
            numParagraphs: {
                label: 'Number of paragraphs',
                detail: null,
                value: numParagraphs,
            },
            numDifficultWords: {
                label: 'Number of difficult words',
                detail: metrics.getDifficultWords(s),
                value: numDifficultWords,
            },
            numPolysyllables: {
                label: 'Number of polysyllables',
                detail: metrics.getPolysyllables(s),
                value: numPolysyllables,
            },
        },
    };
}

function detailAri(val) {
    val = val <= 14 ? val : 14;
    const index = lookupAri()[val];

    return `Age: ${index.age}
        Grade level: ${index.grade}`;
}

function lookupAri() {
    return {
        1: {
            age: '5–6',
            grade: 'Kindergarten',
        },
        2: {
            age: '6–7',
            grade: 'First Grade',
        },
        3: {
            age: '7–8',
            grade: 'Second Grade',
        },
        4: {
            age: '8–9',
            grade: 'Third Grade',
        },
        5: {
            age: '9–10',
            grade: 'Fourth Grade',
        },
        6: {
            age: '10–11',
            grade: 'Fifth Grade',
        },
        7: {
            age: '11–12',
            grade: 'Sixth Grade',
        },
        8: {
            age: '12–13',
            grade: 'Seventh Grade',
        },
        9: {
            age: '13–14',
            grade: 'Eighth Grade',
        },
        10: {
            age: '14–15',
            grade: 'Ninth Grade',
        },
        11: {
            age: '15–16',
            grade: 'Tenth Grade',
        },
        12: {
            age: '16–17',
            grade: 'Eleventh Grade',
        },
        13: {
            age: '17–18',
            grade: 'Twelfth Grade',
        },
        14: {
            age: '18–22',
            grade: 'College student',
        },
    };
}

function detailColemanLiau(val) {
    const rounded = Math.round(val);
    const index = lookupColemanLiau()[rounded < 18 ? rounded : 17];

    return `Grade level: ${index.grade}`;
}

function lookupColemanLiau() {
    return {
        1: {
            grade: 'First Grade',
        },
        2: {
            grade: 'Second Grade',
        },
        3: {
            grade: 'Third Grade',
        },
        4: {
            grade: 'Fourth Grade',
        },
        5: {
            grade: 'Fifth Grade',
        },
        6: {
            grade: 'Sixth Grade',
        },
        7: {
            grade: 'Seventh Grade',
        },
        8: {
            grade: 'Eighth Grade',
        },
        9: {
            grade: 'Ninth Grade',
        },
        10: {
            grade: 'Tenth Grade',
        },
        11: {
            grade: 'Eleventh Grade',
        },
        12: {
            grade: 'Twelfth Grade',
        },
        13: {
            grade: 'College students or high school graduates (undergraduate college level)',
        },
        14: {
            grade: 'College students or high school graduates (undergraduate college level)',
        },
        15: {
            grade: 'College students or high school graduates (undergraduate college level)',
        },
        16: {
            grade: 'College students or high school graduates (undergraduate college level)',
        },
        17: {
            grade: 'Graduate-level readers (postgraduate college level)',
        },
    };
}

function detailDaleChall(val) {
    const lookup = lookupDaleChall();

    for (const key of Object.keys(lookup)) {
        if (+val <= +key) {
            return lookup[key];
        }
    }

    // Safety net
    return 'College level and above';
}

function lookupDaleChall() {
    return {
        4.9: 'Easily understood by an average 4th-grade student or lower',
        5.9: 'Easily understood by an average 5th- or 6th-grade student',
        6.9: 'Easily understood by an average 7th- or 8th-grade student',
        7.9: 'Easily understood by an average 9th- or 10th-grade student',
        8.9: 'Easily understood by an average 11th- or 12th-grade student',
        9.9: 'Easily understood by an average college student',
    };
}

function detailFleschReadingEase(val) {
    const lookup = lookupFleschReadingEase();

    for (const key of Object.keys(lookup)) {
        if (+val <= +key) {
            return lookup[key];
        }
    }

    // Safety net
    return 'College level and above';
}

function lookupFleschReadingEase() {
    return {
        10: 'Professional. Extremely difficult to read. Best understood by university graduates.',
        30: 'College graduate. Very difficult to read. Best understood by university graduates.',
        50: 'College. Difficult to read.',
        60: '10th to 12th grade. Fairly difficult to read.',
        70: '8th & 9th grade. Plain English. Easily understood by 13- to 15-year-old students.',
        80: '7th grade. Fairly easy to read.',
        90: '6th grade. Easy to read. Conversational English for consumers.',
        100: '5th grade. Very easy to read. Easily understood by an average 11-year-old student.',
    };
}

function detailGunningFog(val) {
    const lookup = lookupGunningFog();

    for (const key of Object.keys(lookup)) {
        if (+val <= +key) {
            return lookup[key];
        }
    }

    // Safety net
    return 'College level and above';
}

function lookupGunningFog() {
    return {
        6: 'Sixth grade',
        7: 'Seventh grade',
        8: 'Eighth grade',
        9: 'High school freshman',
        10: 'High school sophomore',
        11: 'High school junior',
        12: 'High school senior',
        13: 'College freshman',
        14: 'College sophomore',
        15: 'College junior',
        16: 'College senior',
        17: 'College graduate',
    };
}

function detailSmog(val) {
    const lookup = lookupSmog();

    for (const key of Object.keys(lookup)) {
        if (+val <= +key) {
            return lookup[key];
        }
    }

    // Safety net
    return 'College level and above';
}

function lookupSmog() {
    return {
        5: '5th Grade. Age 10-11. Elementary school',
        6: '6th Grade. Age 11-12. Elementary school',
        7: '7th Grade. Age 12-13. Middle school',
        8: '8th Grade. Age 13-14. Middle school',
        9: '9th Grade. Age 14-15. High school',
        10: '10th Grade. Age 15-16. High school',
        11: '11th Grade. Age 16-17. High school',
        12: '12th Grade. Age 17-18. High school',
        13: 'College freshman. Age 18-19. College',
        14: 'College sophomore. Age 19-20. College',
        20: 'College junior and above. Age 20+. College/University',
    };
}
