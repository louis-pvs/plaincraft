# Usage: Test (Integration) Template

## Basic Usage

1. **Copy the template:**

   ```bash
   cp templates/test-integration/test-integration.spec.tsx src/__tests__/YourFeature.integration.spec.tsx
   ```

2. **Replace placeholders:**
   - `FeatureName` - Your feature or workflow name
   - Import paths - Components being tested
   - Mock setup - API endpoints and responses
   - Test scenarios - User workflows to verify

3. **Run tests:**
   ```bash
   npm test -- --run src/__tests__/
   npm test YourFeature.integration.spec.tsx
   npm test -- --coverage
   ```

## Template Structure

### Setup/Teardown

- `beforeAll` - Set up test environment, global mocks
- `beforeEach` - Reset state, clear mocks
- `afterEach` - Clean up listeners, timers
- `afterAll` - Restore environment

### Test Scenarios

- **Happy Path:** Core workflow works end-to-end
- **Error Handling:** API failures, validation errors
- **Edge Cases:** Empty states, loading states
- **State Management:** Data flows between components

## Examples

### API Integration Test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { UserProfile } from '@/pages/UserProfile'
import { mockUser } from '@/test/fixtures'

const server = setupServer(
  rest.get('/api/user/:id', (req, res, ctx) => {
    return res(ctx.json(mockUser))
  })
)

describe('UserProfile Integration', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('loads and displays user data', async () => {
    render(<UserProfile userId="123" />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    server.use(
      rest.get('/api/user/:id', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    render(<UserProfile userId="123" />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })

  it('updates profile when form submitted', async () => {
    const user = userEvent.setup()
    render(<UserProfile userId="123" />)

    await waitFor(() => screen.getByLabelText(/name/i))

    const nameInput = screen.getByLabelText(/name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/saved successfully/i)).toBeInTheDocument()
    })
  })
})
```

### Multi-Component Workflow Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '@/App'

describe('Shopping Cart Workflow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('completes full purchase flow', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Navigate to product page
    await user.click(screen.getByRole('link', { name: /products/i }))
    expect(screen.getByRole('heading', { name: /products/i })).toBeInTheDocument()

    // Add item to cart
    const productCard = screen.getByTestId('product-1')
    await user.click(within(productCard).getByRole('button', { name: /add to cart/i }))

    // Verify cart badge updates
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('1')

    // Navigate to cart
    await user.click(screen.getByRole('link', { name: /cart/i }))
    expect(screen.getByRole('heading', { name: /shopping cart/i })).toBeInTheDocument()

    // Proceed to checkout
    await user.click(screen.getByRole('button', { name: /checkout/i }))

    // Fill checkout form
    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/card number/i), '4242424242424242')
    await user.click(screen.getByRole('button', { name: /place order/i }))

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/order confirmed/i)).toBeInTheDocument()
    })
  })
})
```

### State Management Integration

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { TodoApp } from '@/pages/TodoApp'

describe('Todo App State Management', () => {
  beforeEach(() => {
    store.dispatch({ type: 'RESET' })
  })

  it('syncs state across components', async () => {
    const user = userEvent.setup()
    render(
      <Provider store={store}>
        <TodoApp />
      </Provider>
    )

    // Add todo
    const input = screen.getByPlaceholderText(/add todo/i)
    await user.type(input, 'Buy milk')
    await user.keyboard('{Enter}')

    // Verify appears in list
    expect(screen.getByText('Buy milk')).toBeInTheDocument()

    // Verify counter updates
    expect(screen.getByTestId('todo-count')).toHaveTextContent('1')

    // Complete todo
    await user.click(screen.getByRole('checkbox', { name: /buy milk/i }))

    // Verify completed counter updates
    expect(screen.getByTestId('completed-count')).toHaveTextContent('1')
  })
})
```

## Best Practices

### Setup

- Use MSW for API mocking
- Reset mocks between tests
- Clean up side effects (timers, listeners)
- Isolate tests (no shared state)

### Assertions

- Wait for async operations with `waitFor`
- Query by accessible roles/labels
- Test user-visible behavior, not implementation
- Verify side effects (storage, network calls)

### Performance

- Run integration tests separately from unit tests
- Use `--run` flag to skip watch mode
- Mock expensive operations
- Set reasonable timeouts

### Debugging

- Use `screen.debug()` to inspect DOM
- Add `logRoles` to see available queries
- Check network tab for API calls
- Use `--reporter=verbose` for details

## Integration with Scripts

```bash
# Run all integration tests
npm test -- --run src/__tests__/

# Run specific test suite
npm test UserProfile.integration.spec.tsx

# Run with coverage
npm test -- --coverage --run

# CI mode (fail on first error)
node scripts/test-storybook.mjs --ci

# Watch mode for development
npm test -- --watch src/__tests__/
```

## Vitest Configuration

Integration tests use same `vitest.config.ts` but with:

- Longer timeout (5000ms vs 1000ms)
- MSW server setup
- Test environment: jsdom
- Coverage thresholds may differ
