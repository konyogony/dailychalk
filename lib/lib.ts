import { DailyProblems } from './types';

export const problemSet: DailyProblems = {
    Integration: {
        Easy: {
            id: 'int-e-1',
            date: new Date(),
            problemLatex: '$$\\int 7x^6 \\, dx$$',
            possibleAnswers: ['x^7 + C', '42x^5 + C', '7x^7 / 7 + C', 'x^7'],
            fullSolutionLatex:
                'Step 1: Identify the power rule $\\int x^n dx = \\frac{x^{n+1}}{n+1}$. \n\nStep 2: Apply the rule to $7x^6$: $\\int 7x^6 dx = 7 \\cdot \\frac{x^{6+1}}{6+1}$. \n\nStep 3: Simplify the fraction: $7 \\cdot \\frac{x^7}{7} = x^7$. \n\nStep 4: Add the constant of integration: $x^7 + C$.',
            hintsLatex: [
                'This is a standard polynomial. You need the Power Rule for integration.',
                'The Power Rule states: Increase the exponent by 1, then divide the term by that new exponent.',
                'Multiplicative constants (like the 7) can be pulled outside the integral sign and multiplied back at the end.',
                'Don’t forget that every indefinite integral needs an arbitrary constant $+ C$.',
            ],
            topicsCovered: ['Power Rule'],
            difficultyLevel: 'Easy',
            problemType: 'Integration',
        },
        Medium: {
            id: 'int-m-1',
            date: new Date(),
            problemLatex: '$$\\int x e^{x^2} \\, dx$$',
            possibleAnswers: ['1/2 e^{x^2} + C', 'e^{x^2} + C', '2e^{x^2} + C', '0.5 e^{x^2} + C'],
            fullSolutionLatex:
                'Step 1: Use $u$-substitution. Let $u = x^2$. \n\nStep 2: Differentiate $u$ with respect to $x$: $du = 2x \\, dx$, which implies $x \\, dx = \\frac{1}{2}du$. \n\nStep 3: Substitute $u$ and $du$ into the original integral: $\\int e^u \\cdot \\frac{1}{2} du$. \n\nStep 4: Integrate the exponential function: $\\frac{1}{2} e^u + C$. \n\nStep 5: Replace $u$ with the original expression $x^2$ to get $\\frac{1}{2} e^{x^2} + C$.',
            hintsLatex: [
                'Notice that the term $x$ outside the exponent is almost the derivative of the exponent $x^2$.',
                "This pattern ($f'(x) \\cdot e^{f(x)}$) strongly suggests using $u$-substitution.",
                'Let $u = x^2$. What is $du$ in terms of $dx$?',
                'You will find that $x dx$ is exactly half of $du$. Factor that $1/2$ out of the integral.',
            ],
            topicsCovered: ['Substitution'],
            difficultyLevel: 'Medium',
            problemType: 'Integration',
        },
        Hard: {
            id: 'int-h-1',
            date: new Date(),
            problemLatex: '$$\\int \\frac{1}{x^4 + 1} \\, dx$$',
            possibleAnswers: [
                '1/(4sqrt(2)) ln|(x^2+x sqrt(2)+1)/(x^2-x sqrt(2)+1)| + 1/(2sqrt(2)) arctan((x sqrt(2))/(1-x^2)) + C',
                '1/4 ln|x^4 + 1| + C',
                'arctan(x^2) + C',
                '1/2 arctan(x^2/2) + C',
            ],
            fullSolutionLatex:
                'Step 1: Factor the denominator using the Sophie Germain identity: $x^4 + 1 = (x^2+1)^2 - 2x^2 = (x^2 + \\sqrt{2}x + 1)(x^2 - \\sqrt{2}x + 1)$. \n\nStep 2: Use Partial Fraction Decomposition: $\\frac{1}{x^4+1} = \\frac{Ax+B}{x^2+\\sqrt{2}x+1} + \\frac{Cx+D}{x^2-\\sqrt{2}x+1}$. \n\nStep 3: Solving for coefficients gives $A=\\frac{1}{2\\sqrt{2}}, B=\\frac{1}{2}, C=-\\frac{1}{2\\sqrt{2}}, D=\\frac{1}{2}$. \n\nStep 4: Split each fraction into a natural log form (by completing the derivative of the denominator in the numerator) and an arctan form (by completing the square). \n\nStep 5: Integrate and combine terms using log laws.',
            hintsLatex: [
                'The denominator doesn\'t look factorable at first glance, but try "completing the square" for the $x^4$ and $1$ terms.',
                'Add and subtract $2x^2$ to the denominator. This allows you to treat it as a difference of two squares.',
                'Once you have two quadratic factors, use Partial Fraction Decomposition.',
                'Each resulting integral will likely require completing the square in the denominator to reach an $\\arctan$ or $\\ln$ form.',
            ],
            topicsCovered: ['Partial Fractions', 'Sophie Germain Identity', 'Advanced Integration'],
            difficultyLevel: 'Hard',
            problemType: 'Integration',
        },
    },
    Differentiation: {
        Easy: {
            id: 'diff-e-1',
            date: new Date(),
            problemLatex: '$$\\frac{d}{dx}(5x^3 - 10)$$',
            possibleAnswers: ['15x^2', '15x^2 - 10', '5x^2', '45x'],
            fullSolutionLatex:
                'Step 1: Apply the difference rule: differentiate each term separately. \n\nStep 2: For $5x^3$, use the Power Rule: $3 \\times 5x^{3-1} = 15x^2$. \n\nStep 3: For the constant $-10$, the derivative of any constant is $0$. \n\nStep 4: Combine the results: $15x^2 - 0 = 15x^2$.',
            hintsLatex: [
                'The derivative of a sum or difference is the sum or difference of the derivatives.',
                'Use the Power Rule: $\\frac{d}{dx}[ax^n] = anx^{n-1}$.',
                "Remember that a constant value (like 10) doesn't change as $x$ changes, so its rate of change (derivative) is zero.",
            ],
            topicsCovered: ['Basic Derivatives'],
            difficultyLevel: 'Easy',
            problemType: 'Differentiation',
        },
        Medium: {
            id: 'diff-m-1',
            date: new Date(),
            problemLatex: '$$\\frac{d}{dx}(\\ln(x^2 + 1))$$',
            possibleAnswers: ['2x / (x^2 + 1)', '1 / (x^2 + 1)', 'x / (x^2 + 1)', '2 / (x^2 + 1)'],
            fullSolutionLatex:
                'Step 1: Recognize this as a composite function $f(g(x))$, where the outer function is $\\ln(u)$. \n\nStep 2: Apply the Chain Rule: $\\frac{d}{dx}[\\ln(u)] = \\frac{1}{u} \\cdot \\frac{du}{dx}$. \n\nStep 3: Let $u = x^2 + 1$. Then $\\frac{du}{dx} = 2x$. \n\nStep 4: Substitute back: $\\frac{1}{x^2+1} \\cdot 2x = \\frac{2x}{x^2+1}$.',
            hintsLatex: [
                'You have a function ($x^2+1$) inside another function ($\\ln$). This requires the Chain Rule.',
                'First, differentiate the natural log: the derivative of $\\ln(f)$ is $1/f$.',
                'Second, multiply that by the derivative of whatever was "inside" the log.',
                'The derivative of $x^2+1$ is $2x$. Put it all together.',
            ],
            topicsCovered: ['Chain Rule'],
            difficultyLevel: 'Medium',
            problemType: 'Differentiation',
        },
        Hard: {
            id: 'diff-h-1',
            date: new Date(),
            problemLatex:
                '$$\\text{Find } \\frac{dy}{dx} \\text{ if } y = \\arctan\\left(\\frac{\\sqrt{1+x^2}-1}{x}\\right)$$',
            possibleAnswers: ['1 / (2(1+x^2))', '1 / (1+x^2)', '1 / (2 + 2x^2)', '1 / (2sqrt(1+x^2))'],
            fullSolutionLatex:
                'Step 1: Use Trigonometric Substitution to simplify the expression before differentiating. Let $x = \\tan\\theta$. \n\nStep 2: Substitute: $y = \\arctan\\left(\\frac{\\sqrt{1+\\tan^2\\theta}-1}{\\tan\\theta}\\right)$. \n\nStep 3: Use the identity $\\sqrt{1+\\tan^2\\theta} = \\sec\\theta$. The expression becomes $\\frac{\\sec\\theta - 1}{\\tan\\theta}$. \n\nStep 4: Convert to sine and cosine: $\\frac{(1/\\cos\\theta) - 1}{\\sin\\theta/\\cos\\theta} = \\frac{1-\\cos\\theta}{\\sin\\theta}$. \n\nStep 5: Apply half-angle identities: $\\frac{2\\sin^2(\\theta/2)}{2\\sin(\\theta/2)\\cos(\\theta/2)} = \\tan(\\theta/2)$. \n\nStep 6: So $y = \\arctan(\\tan(\\theta/2)) = \\frac{1}{2}\\theta$. \n\nStep 7: Since $x = \\tan\\theta$, then $\\theta = \\arctan x$. Thus $y = \\frac{1}{2}\\arctan x$. \n\nStep 8: Differentiate: $\\frac{dy}{dx} = \\frac{1}{2} \\cdot \\frac{1}{1+x^2}$.',
            hintsLatex: [
                'Differentiating this directly using the Chain Rule and Quotient Rule will be extremely messy. Try to simplify the expression first.',
                'Look at the structure $\\sqrt{1+x^2}$. This often suggests a substitution like $x = \\tan\\theta$.',
                'After substituting $x = \\tan\\theta$, use trigonometric identities to simplify the fraction inside the $\\arctan$.',
                'Specifically, look for the half-angle formula for tangent: $\\tan(\\theta/2) = \\frac{1-\\cos\\theta}{\\sin\\theta}$.',
                'Once simplified, the differentiation becomes a one-step process.',
            ],
            topicsCovered: ['Trigonometric Substitution', 'Calculus Identities'],
            difficultyLevel: 'Hard',
            problemType: 'Differentiation',
        },
    },
    'Further Math (9231)': {
        Easy: {
            id: 'fm-e-1',
            date: new Date(),
            problemLatex: '$$\\text{If } z_1 = 3 + 2i \\text{ and } z_2 = 1 - 4i, \\text{ find } z_1 + z_2$$',
            possibleAnswers: ['4 - 2i', '4 + 6i', '2 - 2i', '4 - 2j'],
            fullSolutionLatex:
                'Step 1: To add complex numbers, you sum the real parts and imaginary parts independently. \n\nStep 2: Real parts: $3 + 1 = 4$. \n\nStep 3: Imaginary parts: $2i + (-4i) = -2i$. \n\nStep 4: Result: $4 - 2i$.',
            hintsLatex: [
                'Treat $i$ like a variable (like $x$) and collect "like terms".',
                'Add the real numbers together.',
                'Add the imaginary coefficients ($i$ terms) together.',
            ],
            topicsCovered: ['Complex Numbers'],
            difficultyLevel: 'Easy',
            problemType: 'Further Math (9231)',
        },
        Medium: {
            id: 'fm-m-1',
            date: new Date(),
            problemLatex: '$$\\sum_{r=1}^{n} r(r+1)$$',
            possibleAnswers: ['1/3 n(n+1)(n+2)', 'n(n+1)(n+2) / 3', '1/6 n(n+1)(2n+1)', 'n^2+n'],
            fullSolutionLatex:
                'Step 1: Expand the product inside the sum: $\\sum_{r=1}^n (r^2 + r)$. \n\nStep 2: Distribute the summation sign: $\\sum r^2 + \\sum r$. \n\nStep 3: Use the standard results: $\\frac{n(n+1)(2n+1)}{6} + \\frac{n(n+1)}{2}$. \n\nStep 4: Factor out $\\frac{n(n+1)}{2}$, leaving $[\\frac{2n+1}{3} + 1]$. \n\nStep 5: Simplify the term in brackets to $\\frac{2n+4}{3}$, which is $\\frac{2(n+2)}{3}$. \n\nStep 6: Combine to get $\\frac{n(n+1)(n+2)}{3}$.',
            hintsLatex: [
                'Start by expanding the expression $r(r+1)$.',
                'You can split the summation: $\\sum (a_r + b_r) = \\sum a_r + \\sum b_r$.',
                'Recall the standard formula for $\\sum r^2$ and $\\sum r$.',
                'Factor out the common terms ($n$ and $n+1$) as early as possible to make the algebra easier.',
            ],
            topicsCovered: ['Series'],
            difficultyLevel: 'Medium',
            problemType: 'Further Math (9231)',
        },
        Hard: {
            id: 'fm-h-1',
            date: new Date(),
            problemLatex: '$$\\text{Find the sum to } n \\text{ terms of } \\sum_{r=1}^{n} \\frac{1}{r(r+1)(r+2)}$$',
            possibleAnswers: [
                '1/4 - 1 / (2(n+1)(n+2))',
                '0.25 - 0.5/((n+1)(n+2))',
                '1/2 (1/2 - 1/((n+1)(n+2)))',
                '1/4(1 - 1/(n+1))',
            ],
            fullSolutionLatex:
                'Step 1: Decompose the general term into partial fractions: $\\frac{1}{r(r+1)(r+2)} = \\frac{1}{2r} - \\frac{1}{r+1} + \\frac{1}{2(r+2)}$. \n\nStep 2: List the first few terms of the sum to see the pattern. \n\nStep 3: For $r=1$: $(\\frac{1}{2} - \\frac{1}{2} + \\frac{1}{6})$. For $r=2$: $(\\frac{1}{4} - \\frac{1}{3} + \\frac{1}{8})$. For $r=3$: $(\\frac{1}{6} - \\frac{1}{4} + \\frac{1}{10})$. \n\nStep 4: Notice the "Method of Differences" (telescoping). Most terms will cancel out across the sum. \n\nStep 5: The only terms remaining are the start of the first two terms and the end of the last two terms. \n\nStep 6: Simplify the remaining terms to reach $\\frac{1}{4} - \\frac{1}{2(n+1)(n+2)}$.',
            hintsLatex: [
                'This is a telescoping series problem. You need to use the Method of Differences.',
                'Begin by splitting the fraction using Partial Fraction Decomposition.',
                'The partial fractions should look like: $\\frac{A}{r} + \\frac{B}{r+1} + \\frac{C}{r+2}$.',
                'Write out the first 3 terms and the last 2 terms of the summation. Cross out the values that cancel each other out.',
                'Be careful: with three terms in the denominator, the cancellation usually happens across a "gap" of terms.',
            ],
            topicsCovered: ['Series', 'Method of Differences'],
            difficultyLevel: 'Hard',
            problemType: 'Further Math (9231)',
        },
    },
    'Mathematics (9709)': {
        Easy: {
            id: 'math-e-1',
            date: new Date(),
            problemLatex: '$$\\text{Find the gradient of the line } 2y - 6x = 5$$',
            possibleAnswers: ['3', '-3', '6', '3.0'],
            fullSolutionLatex:
                'Step 1: To find the gradient, rearrange the equation into the form $y = mx + c$, where $m$ is the gradient. \n\nStep 2: Add $6x$ to both sides: $2y = 6x + 5$. \n\nStep 3: Divide every term by 2: $y = 3x + 2.5$. \n\nStep 4: Identify the coefficient of $x$: $m = 3$.',
            hintsLatex: [
                'The easiest way to find a gradient is to put the equation into "$y = \dots$" form.',
                'The gradient is the number multiplying the $x$ variable once $y$ is isolated.',
                'If you have $2y$, you must divide everything by 2 to solve for $y$.',
            ],
            topicsCovered: ['Coordinate Geometry'],
            difficultyLevel: 'Easy',
            problemType: 'Mathematics (9709)',
        },
        Medium: {
            id: 'math-m-1',
            date: new Date(),
            problemLatex: '$$y = 2x^2 - 8x + 5. \\text{ Find the coordinates of the vertex.}$$',
            possibleAnswers: ['(2, -3)', '(2, -3.0)', 'x=2, y=-3', '2, -3'],
            fullSolutionLatex:
                'Step 1: For a quadratic $ax^2 + bx + c$, the x-coordinate of the vertex is $x = -b / (2a)$. \n\nStep 2: Here $a=2$ and $b=-8$. So $x = -(-8) / (2 \\cdot 2) = 8 / 4 = 2$. \n\nStep 3: To find the y-coordinate, substitute $x=2$ back into the original equation. \n\nStep 4: $y = 2(2)^2 - 8(2) + 5 = 8 - 16 + 5 = -3$. \n\nStep 5: The vertex is $(2, -3)$.',
            hintsLatex: [
                'The vertex is the turning point of the parabola.',
                'You can find the x-coordinate using the formula $x = -b/2a$ or by completing the square.',
                'Once you have the x-value, plug it back into the original formula to find the corresponding y-value.',
                'Alternatively, if you know calculus, the vertex occurs where the derivative $dy/dx$ is equal to 0.',
            ],
            topicsCovered: ['Quadratics'],
            difficultyLevel: 'Medium',
            problemType: 'Mathematics (9709)',
        },
        Hard: {
            id: 'math-h-1',
            date: new Date(),
            problemLatex: '$$\\text{Solve } 2\\sin^2 x + 3\\cos x = 0 \\text{ for } 0 \\le x \\le 2\\pi$$',
            possibleAnswers: ['2pi/3, 4pi/3', '120, 240', '2/3 pi, 4/3 pi', '2.09, 4.19'],
            fullSolutionLatex:
                'Step 1: Use the Pythagorean identity $\\sin^2 x = 1 - \\cos^2 x$ to make the equation involve only one trigonometric function. \n\nStep 2: Substitute: $2(1 - \\cos^2 x) + 3\\cos x = 0$. \n\nStep 3: Expand and rearrange: $2 - 2\\cos^2 x + 3\\cos x = 0 \\implies 2\\cos^2 x - 3\\cos x - 2 = 0$. \n\nStep 4: Treat this as a quadratic $2u^2 - 3u - 2 = 0$ where $u = \\cos x$. \n\nStep 5: Factor the quadratic: $(2\\cos x + 1)(\\cos x - 2) = 0$. \n\nStep 6: This gives $\\cos x = -1/2$ or $\\cos x = 2$. \n\nStep 7: $\\cos x = 2$ has no solutions because the range of cosine is $[-1, 1]$. \n\nStep 8: $\\cos x = -1/2$ has solutions in the 2nd and 3rd quadrants: $x = 2\\pi/3$ and $x = 4\\pi/3$.',
            hintsLatex: [
                "You can't solve this easily with both $\\sin$ and $\\cos$. Use an identity to turn $\\sin^2 x$ into something involving $\\cos$.",
                'Recall that $\\sin^2 x + \\cos^2 x = 1$.',
                'After substituting, you will have a quadratic equation. Let $u = \\cos x$ to see it more clearly.',
                'Solve the quadratic for $\\cos x$. One of the values might be impossible (out of the range of the cosine function).',
                'Find the angles in the specified range ($0$ to $2\\pi$) that satisfy the valid $\\cos x$ value.',
            ],
            topicsCovered: ['Trigonometry', 'Quadratic Equations'],
            difficultyLevel: 'Hard',
            problemType: 'Mathematics (9709)',
        },
    },
};
