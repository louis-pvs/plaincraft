# Usage: Test (Unit) Template

## Basic Usage

1. **Copy the template:**

   ```bash
   cp templates/test-unit/test-unit.spec.ts src/components/YourComponent.spec.tsx
   ```

2. **Replace placeholders:**
   - `ComponentName` - Your component or function name
   - `@/components/ComponentName` - Import path
   - Test cases - Add specific scenarios

3. **Run tests:**
   ```bash
   npm test YourComponent.spec.tsx
   npm test -- --watch  # Watch mode
   npm test -- --coverage  # Coverage report
   ```

## Template Structure

### Describe Blocks

- **Top-level:** Component or module name
- **Nested:** Feature or method groups

### Test Cases (it blocks)

- **Rendering:** Component appears correctly
- **Interactions:** User events trigger expected behavior
- **Props:** Different prop combinations work
- **Edge Cases:** Handles empty/null/error states

## Examples

### React Component Test

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/Button'

describe('Button', () => {
  describe('rendering', () => {
    it('renders with label text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('applies variant styles', () => {
      render(<Button variant="primary">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('btn-primary')
    })
  })

  describe('interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click</Button>)

      await userEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick} disabled>Click</Button>)

      await userEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has accessible name', () => {
      render(<Button aria-label="Submit form">→</Button>)
      expect(screen.getByLabelText('Submit form')).toBeInTheDocument()
    })
  })
})
```

### Utility Function Test

```typescript
import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/utils/currency";

describe("formatCurrency", () => {
  it("formats positive numbers", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative numbers", () => {
    expect(formatCurrency(-99.99)).toBe("-$99.99");
  });

  it("handles very large numbers", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(1.999)).toBe("$2.00");
  });
});
```

## Best Practices

### Naming

- File: `ComponentName.spec.tsx` or `utils.spec.ts`
- Test: Use descriptive names starting with verb
  - ✅ "renders with label text"
  - ❌ "test button"

### Organization

- Group related tests in describe blocks
- Keep tests independent (no shared state)
- One assertion per test (when possible)

### Performance

- Mock expensive operations (timers, network)
- Use `beforeEach` for common setup
- Avoid testing implementation details

### Coverage

- Aim for 80%+ code coverage
- Focus on critical paths first
- Test edge cases and error states

## Integration with Scripts

```bash
# Run all unit tests
npm test

# Run specific test file
npm test Button.spec.tsx

# Watch mode during development
npm test -- --watch

# Coverage report
npm test -- --coverage

# Run tests in CI
node scripts/test-storybook.mjs --ci
```

## Vitest Configuration

Tests use `vitest.config.ts` from project root with:

- React Testing Library setup
- Component mocking utilities
- Coverage thresholds
- Test environment (jsdom for React)
