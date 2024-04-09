import nlp from 'compromise';

export function getAbbreviations(s) {
    return nlp(s).abbreviations().out('array');
}

export function getAcronyms(s) {
    return nlp(s).acronyms().out('array');
}

export function getAdverbs(s) {
    return nlp(s).adverbs().out('array');
}

export function getConjunctions(s) {
    return nlp(s).conjunctions().out('array');
}

export function getHyphenated(s) {
    return nlp(s).hyphenated().out('array');
}

export function getNouns(s) {
    return nlp(s).nouns().out('array');
}

export function getPossessives(s) {
    return nlp(s).possessives().out('array');
}

export function getPrepositions(s) {
    return nlp(s).prepositions().out('array');
}

export function getPronouns(s) {
    return nlp(s).pronouns().out('array');
}
