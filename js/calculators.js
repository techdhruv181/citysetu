// Utility to cleanly format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

// ================= SIP CALCULATOR =================
export function calculateSIP(monthlyInvestment, expectedReturnRate, timePeriodYears) {
    if (!monthlyInvestment || !expectedReturnRate || !timePeriodYears) return null;
    
    let i = (expectedReturnRate / 100) / 12;
    let n = timePeriodYears * 12;
    let p = monthlyInvestment;
    
    let futureValue = p * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    let investedAmount = p * n;
    let estReturns = futureValue - investedAmount;
    
    return {
        investedAmount: formatCurrency(investedAmount),
        estReturns: formatCurrency(estReturns),
        totalValue: formatCurrency(futureValue)
    };
}

// ================= EMI CALCULATOR =================
export function calculateEMI(principal, annualRate, tenureYears) {
    if (!principal || !annualRate || !tenureYears) return null;
    
    let p = principal;
    let r = (annualRate / 12) / 100;
    let n = tenureYears * 12;
    
    let emi = p * r * (Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
    let totalPayment = emi * n;
    let totalInterest = totalPayment - p;
    
    return {
        monthlyEmi: formatCurrency(emi),
        totalInterest: formatCurrency(totalInterest),
        totalPayment: formatCurrency(totalPayment)
    };
}

// ================= INTEREST CALCULATOR =================
export function calculateSimpleInterest(principal, rate, years) {
    if (!principal || !rate || !years) return null;
    let si = (principal * rate * years) / 100;
    return {
        interestAmount: formatCurrency(si),
        totalAmount: formatCurrency(principal + si)
    };
}

export function calculateCompoundInterest(principal, rate, years, compFreqPerYear = 1) {
    if (!principal || !rate || !years) return null;
    let r = rate / 100;
    let amount = principal * Math.pow((1 + (r / compFreqPerYear)), (compFreqPerYear * years));
    let ci = amount - principal;
    return {
        interestAmount: formatCurrency(ci),
        totalAmount: formatCurrency(amount)
    };
}

// ================= GST CALCULATOR =================
export function calculateGST(amount, gstPercentage, isAddingGST = true) {
    if (!amount || gstPercentage == null) return null;
    
    if (isAddingGST) {
        let gstAmount = amount * (gstPercentage / 100);
        let finalPrice = amount + gstAmount;
        return {
            originalCost: formatCurrency(amount),
            gstAmount: formatCurrency(gstAmount),
            finalPrice: formatCurrency(finalPrice)
        };
    } else { // Removing GST backwards
        let originalCost = amount / (1 + (gstPercentage / 100));
        let gstAmount = amount - originalCost;
        return {
            originalCost: formatCurrency(originalCost),
            gstAmount: formatCurrency(gstAmount),
            finalPrice: formatCurrency(amount) // The inserted amount was the final
        };
    }
}

// ================= DISCOUNT CALCULATOR =================
export function calculateDiscount(originalPrice, discountPercentage) {
    if (!originalPrice || discountPercentage == null) return null;
    let savings = originalPrice * (discountPercentage / 100);
    let finalPrice = originalPrice - savings;
    return {
        savings: formatCurrency(savings),
        finalPrice: formatCurrency(finalPrice)
    };
}

// ================= PERCENTAGE CALCULATOR =================
export function calculatePercentage(part, total) {
    if (total == 0) return null;
    return {
        percentage: ((part / total) * 100).toFixed(2) + "%"
    };
}
export function calculatePercentageOf(percentage, total) {
    return {
        result: ((percentage / 100) * total).toFixed(2)
    };
}

// ================= PROFIT MARGIN CALCULATOR =================
export function calculateProfit(costPrice, salesPrice) {
    if (!costPrice || !salesPrice) return null;
    
    let grossProfit = salesPrice - costPrice;
    let margin = (grossProfit / salesPrice) * 100;
    let markup = (grossProfit / costPrice) * 100;
    
    return {
        grossProfit: formatCurrency(grossProfit),
        margin: margin.toFixed(2) + "%",
        markup: markup.toFixed(2) + "%"
    };
}
