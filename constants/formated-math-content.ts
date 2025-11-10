export const formatMathContent = (content: string): string => {
    let formatted = content;

    // Remove filler words and repetitions
    formatted = formatted
        .replace(/hash,?\s*/gi, '')  // Remove "hash" filler words
        .replace(/um+,?\s*/gi, '')    // Remove "um" filler words
        .replace(/uh+,?\s*/gi, '');   // Remove "uh" filler words

    // Replace word-based math with symbols
    formatted = formatted
        // Equals variations
        .replace(/equal\s+sign/gi, '=')
        .replace(/equals\s+sign/gi, '=')
        .replace(/\bequals?\b/gi, '=')

        // Dot product variations
        .replace(/\bdot\b/gi, '·')

        // Basic operations
        .replace(/\bplus\b/gi, '+')
        .replace(/\bminus\b/gi, '−')
        .replace(/\btimes\b/gi, '×')
        .replace(/\bmultiplied\s+by\b/gi, '×')
        .replace(/\bdivided\s+by\b/gi, '÷')
        .replace(/\bover\b/gi, '/')
        .replace(/\bmodulus\b|\bmodulo\b/gi, ' mod ')

        // Powers and exponents
        .replace(/\bsquared\b/gi, '²')
        .replace(/\bcubed\b/gi, '³')
        .replace(/\bto\s+the\s+power\s+of\s+(\d+)/gi, '^$1')
        .replace(/\braised\s+to\s+the\s+power\s+of\s+(\d+)/gi, '^$1')

        // Roots
        .replace(/\bsquare\s+root\s+of\b/gi, '√')
        .replace(/\bcube\s+root\s+of\b/gi, '∛')
        .replace(/\bnth\s+root\s+of\b/gi, 'ⁿ√')

        // Fractions
        .replace(/\bone\s+half\b/gi, '½')
        .replace(/\bone\s+third\b/gi, '⅓')
        .replace(/\btwo\s+thirds\b/gi, '⅔')
        .replace(/\bone\s+quarter\b/gi, '¼')
        .replace(/\bthree\s+quarters\b/gi, '¾')
        .replace(/\bfourth\b/gi, '¼')

        // Percentages
        .replace(/\bpercent(?!age)\b/gi, '%')
        .replace(/\bpercentage\b/gi, '%')

        // Greek letters
        .replace(/\bpi\b/gi, 'π')
        .replace(/\balpha\b/gi, 'α')
        .replace(/\bbeta\b/gi, 'β')
        .replace(/\bgamma\b/gi, 'γ')
        .replace(/\btheta\b/gi, 'θ')
        .replace(/\blambda\b/gi, 'λ')
        .replace(/\bsigma\b/gi, 'σ')
        .replace(/\bomega\b/gi, 'ω')
        .replace(/\bdelta\b/gi, 'Δ')
        .replace(/\bphi\b/gi, 'φ')
        .replace(/\bpsi\b/gi, 'ψ')

        // Trigonometric and log functions
        .replace(/\bsine\b/gi, 'sin')
        .replace(/\bcosine\b/gi, 'cos')
        .replace(/\btangent\b/gi, 'tan')
        .replace(/\bcotangent\b/gi, 'cot')
        .replace(/\bsecant\b/gi, 'sec')
        .replace(/\bcosecant\b/gi, 'csc')
        .replace(/\blogarithm\b/gi, 'log')
        .replace(/\bnatural\s+log\b/gi, 'ln')
        .replace(/\bexponential\b/gi, 'exp')

        // Calculus symbols
        .replace(/\bderivative\b/gi, 'd/dx')
        .replace(/\bintegral\b/gi, '∫')
        .replace(/\bdouble\s+integral\b/gi, '∬')
        .replace(/\btriple\s+integral\b/gi, '∭')
        .replace(/\bsummation\b/gi, '∑')
        .replace(/\bproduct\b/gi, '∏')
        .replace(/\bdifferential\b/gi, 'd')

        // Geometry
        .replace(/\bangle\b/gi, '∠')
        .replace(/\bparallel\b/gi, '∥')
        .replace(/\bperpendicular\b/gi, '⟂')

        // Comparisons
        .replace(/\bgreater\s+than\s+or\s+equal\s+to\b/gi, '≥')
        .replace(/\bless\s+than\s+or\s+equal\s+to\b/gi, '≤')
        .replace(/\bgreater\s+than\b/gi, '>')
        .replace(/\bless\s+than\b/gi, '<')
        .replace(/\bnot\s+equals?\b/gi, '≠')

        // Sets, logic, and notation
        .replace(/\bunion\b/gi, '∪')
        .replace(/\bintersection\b/gi, '∩')
        .replace(/\bsubset\b/gi, '⊂')
        .replace(/\bsuperset\b/gi, '⊃')
        .replace(/\belement\s+of\b/gi, '∈')
        .replace(/\bnot\s+element\s+of\b/gi, '∉')
        .replace(/\bfor\s+all\b/gi, '∀')
        .replace(/\bthere\s+exists\b/gi, '∃')
        .replace(/\bthere\s+does\s+not\s+exist\b/gi, '∄')
        .replace(/\btherefore\b/gi, '∴')
        .replace(/\bbecause\b/gi, '∵')

        // Arrows and implications
        .replace(/\bimplies\b/gi, '⇒')
        .replace(/\bif\s+and\s+only\s+if\b/gi, '⇔')
        .replace(/\bleads\s+to\b/gi, '→')
        .replace(/\btends\s+to\b/gi, '→')
        .replace(/\barrow\b/gi, '→');

    // Clean up spacing
    formatted = formatted
        .replace(/\s*([+\-×÷·=≠><≥≤()^√∫∑∏∪∩⊂⊃∈∉∀∃∄∴∵→⇒⇔∠∥⟂])\s*/g, ' $1 ')
        .replace(/([a-zA-Z0-9])\s*\·\s*([a-zA-Z0-9])/g, '$1 · $2')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s+/g, ' ')
        .replace(/\s+\./g, '.')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\s+([.,;!?])/g, '$1');

    return formatted;
};


export const extractSteps = (content: string): string[] => {
    const steps: string[] = [];

    // Try to find numbered steps
    const stepMatches = content.match(/step\s+\d+[:\s]+[^.!?]+[.!?]/gi);
    if (stepMatches && stepMatches.length > 0) {
        return stepMatches;
    }

    // If no explicit steps, split by sentences
    const sentences = content.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 0) {
        return sentences.slice(0, 3); // Return max 3 sentences
    }

    return [content];
};