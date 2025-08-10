# Portfolio Weightage Calculation Logic

## Overview

The portfolio weightage calculation system has been implemented to handle two distinct scenarios:

1. **First-time portfolio creation** - When creating a new portfolio or adding the first holdings (includes old portfolios without holdings)
2. **Existing portfolio modifications** - When adding holdings to a portfolio that already has existing holdings (applies to all portfolios with holdings)

**Key Feature:** The system automatically detects whether a portfolio has existing holdings, ensuring that both new portfolios and old portfolios from the database are handled correctly according to the same logic.

## Implementation Details

### First-Time Portfolio Creation

**When:** 
- Creating a completely new portfolio
- Adding holdings to any portfolio that currently has no holdings (`holdings.length === 0`)
- **This includes old portfolios from the database that don't have any holdings yet**

**Calculation Base:** 
- Uses `minInvestment` as the base for weightage calculations
- Ensures consistent weightage allocation based on the intended investment amount

**Example:**
```
Min Investment: ₹100,000
New Holding Weight: 10%
Allocated Amount: ₹10,000 (10% of ₹100,000)
```

### Existing Portfolio Modifications

**When:**
- Adding holdings to any portfolio that already has existing holdings
- Editing existing holdings in any portfolio
- **This applies to both new portfolios and old portfolios once they have holdings**

**Calculation Base:**
- Uses current portfolio value (`holdingsValue + cashBalance`) as the base
- Accounts for market movements and ensures weightage reflects current portfolio state

**Example:**
```
Original Min Investment: ₹100,000
Current Holdings Value: ₹120,000 (due to market gains)
Cash Balance: ₹5,000
Current Portfolio Value: ₹125,000

New Holding Weight: 10%
Allocated Amount: ₹12,500 (10% of ₹125,000)
```

## Benefits

### For First-Time Creation (New & Old Portfolios Without Holdings):
- **Predictable Allocation:** Weightage is based on the intended investment amount
- **Clean Start:** No market fluctuation impact on initial allocation
- **Consistent Planning:** Portfolio structure matches the original investment plan
- **Backward Compatibility:** Old portfolios without holdings work the same as new ones

### For Existing Portfolios (With Holdings):
- **Market-Aware:** Weightage reflects current market values
- **Proportional Growth:** New holdings are sized appropriately relative to current portfolio value
- **Dynamic Adjustment:** Accounts for portfolio growth/decline since inception
- **Universal Application:** Works for both newly created and legacy portfolios

## Visual Indicators

The UI provides clear visual indicators to show which calculation method is being used:

- **Blue indicators:** First-time creation (using minimum investment)
- **Green indicators:** Existing portfolio (using current portfolio value)

## Code Implementation

The logic is centralized in the `getWeightageCalculationBase()` helper function:

```typescript
const getWeightageCalculationBase = () => {
  // Check if this is first-time creation by looking at actual holdings count
  // This handles both new portfolios and old portfolios without holdings
  const isFirstTimeCreation = holdings.length === 0;
  const minInvestmentAmount = Number(minInvestment || 0);
  const currentPortfolioValue = holdingsValue + Math.max(0, cashBalance);
  
  return {
    baseAmount: isFirstTimeCreation ? minInvestmentAmount : currentPortfolioValue,
    isFirstTimeCreation,
    context: isFirstTimeCreation ? 'First-time portfolio creation' : 'Existing portfolio modification',
    description: isFirstTimeCreation 
      ? `Using minimum investment (₹${minInvestmentAmount.toLocaleString()}) as weightage base`
      : `Using current portfolio value (₹${currentPortfolioValue.toLocaleString()}) as weightage base`
  };
};
```

## Testing Scenarios

### Scenario 1: New Portfolio Creation
1. Create new portfolio with ₹100,000 minimum investment
2. Add first holding with 20% weight
3. Expected: ₹20,000 allocation (20% of ₹100,000)

### Scenario 2: Existing Portfolio Addition
1. Portfolio originally ₹100,000, now worth ₹120,000 due to market gains
2. Cash balance: ₹5,000
3. Add new holding with 10% weight
4. Expected: ₹12,500 allocation (10% of ₹125,000 current value)

### Scenario 3: Old Portfolio Without Holdings
1. Load old portfolio from database with ₹100,000 minimum investment
2. Portfolio has no existing holdings
3. Add first holding with 15% weight
4. Expected: ₹15,000 allocation (15% of ₹100,000 minimum investment)

### Scenario 4: Editing Existing Holdings
1. Portfolio with current value ₹150,000
2. Edit existing holding to change weight from 15% to 20%
3. Expected: New allocation based on ₹150,000 current value

## Error Handling

The system includes validation to ensure:
- Minimum investment is set before adding holdings
- Total weightage doesn't exceed 100%
- Sufficient cash balance for new allocations
- Proper handling of leftover amounts due to share quantity rounding
- Consistent behavior across new and legacy portfolios
- Automatic detection of portfolio state (with/without holdings)