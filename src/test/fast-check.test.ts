import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('fast-check setup verification', () => {
    it('should run property-based tests with configured iterations', () => {
        let iterations = 0;

        fc.assert(
            fc.property(fc.string(), (str) => {
                iterations++;
                // Property: trimming a string should not increase its length
                return str.trim().length <= str.length;
            }),
            { numRuns: 20 }
        );

        expect(iterations).toBeGreaterThanOrEqual(20);
    });
});
