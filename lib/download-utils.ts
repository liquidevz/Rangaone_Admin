// lib/download-utils.ts
export interface DownloadOptions {
  filename?: string;
  format?: 'csv' | 'json';
  excludeFields?: string[];
  customHeaders?: Record<string, string>;
}

export function downloadData<T extends Record<string, any>>(
  data: T[],
  options: DownloadOptions = {}
) {
  const {
    filename = `data-${new Date().toISOString().split('T')[0]}`,
    format = 'csv',
    excludeFields = [],
    customHeaders = {}
  } = options;

  if (data.length === 0) {
    throw new Error('No data to download');
  }

  if (format === 'csv') {
    downloadCSV(data, filename, excludeFields, customHeaders);
  } else if (format === 'json') {
    downloadJSON(data, filename, excludeFields);
  }
}

function downloadCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  excludeFields: string[],
  customHeaders: Record<string, string>
) {
  // Get all unique keys from the data
  const allKeys = Array.from(
    new Set(data.flatMap(item => Object.keys(item)))
  ).filter(key => !excludeFields.includes(key));

  // Create headers
  const headers = allKeys.map(key => customHeaders[key] || formatHeader(key));
  
  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(item => 
      allKeys.map(key => {
        const value = getNestedValue(item, key);
        return formatCSVValue(value);
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

function downloadJSON<T extends Record<string, any>>(
  data: T[],
  filename: string,
  excludeFields: string[]
) {
  // Filter out excluded fields
  const filteredData = data.map(item => {
    const filtered: Record<string, any> = {};
    Object.keys(item).forEach(key => {
      if (!excludeFields.includes(key)) {
        filtered[key] = item[key];
      }
    });
    return filtered;
  });

  const jsonContent = JSON.stringify(filteredData, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      return current[key];
    }
    return current;
  }, obj);
}

function formatCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `"${value.map(item => 
        typeof item === 'object' ? (item.name || item.title || JSON.stringify(item)) : String(item)
      ).join('; ')}"`;
    }
    if (value.name) return `"${value.name}"`;
    if (value.title) return `"${value.title}"`;
    if (value.email) return `"${value.email}"`;
    return `"${JSON.stringify(value)}"`;
  }
  
  const stringValue = String(value);
  
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

function formatHeader(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
}

// Specific download functions for different data types
export function downloadUsers(users: any[], format: 'csv' | 'json' = 'csv') {
  downloadData(users, {
    filename: `users-${new Date().toISOString().split('T')[0]}`,
    format,
    excludeFields: ['password', '__v'],
    customHeaders: {
      '_id': 'ID',
      'username': 'Username',
      'email': 'Email',
      'fullName': 'Full Name',
      'phone': 'Phone',
      'role': 'Role',
      'emailVerified': 'Email Verified',
      'isBanned': 'Is Banned',
      'createdAt': 'Created Date',
      'updatedAt': 'Updated Date',
      'pandetails': 'PAN Details',
      'dateofBirth': 'Date of Birth',
      'address': 'Address'
    }
  });
}

export function downloadSubscriptions(subscriptions: any[], format: 'csv' | 'json' = 'csv') {
  downloadData(subscriptions, {
    filename: `subscriptions-${new Date().toISOString().split('T')[0]}`,
    format,
    excludeFields: ['__v'],
    customHeaders: {
      '_id': 'ID',
      'user': 'User',
      'portfolio': 'Portfolio',
      'productType': 'Product Type',
      'productId': 'Product ID',
      'subscriptionType': 'Subscription Type',
      'status': 'Status',
      'isActive': 'Is Active',
      'expiryDate': 'Expiry Date',
      'createdAt': 'Created Date',
      'updatedAt': 'Updated Date'
    }
  });
}

export function downloadTips(tips: any[], format: 'csv' | 'json' = 'csv') {
  downloadData(tips, {
    filename: `tips-${new Date().toISOString().split('T')[0]}`,
    format,
    excludeFields: ['__v'],
    customHeaders: {
      '_id': 'ID',
      'title': 'Title',
      'stockId': 'Stock ID',
      'stockSymbol': 'Stock Symbol',
      'stockName': 'Stock Name',
      'action': 'Action',
      'targetPrice': 'Target Price',
      'targetPercentage': 'Target Percentage',
      'status': 'Status',
      'category': 'Category',
      'portfolio': 'Portfolio',
      'content': 'Content',
      'description': 'Description',
      'createdAt': 'Created Date',
      'updatedAt': 'Updated Date'
    }
  });
}

export function downloadBundles(bundles: any[], format: 'csv' | 'json' = 'csv') {
  downloadData(bundles, {
    filename: `bundles-${new Date().toISOString().split('T')[0]}`,
    format,
    excludeFields: ['__v'],
    customHeaders: {
      '_id': 'ID',
      'name': 'Name',
      'description': 'Description',
      'category': 'Category',
      'portfolios': 'Portfolios',
      'monthlyPrice': 'Monthly Price',
      'monthlyemandateprice': 'Monthly E-Mandate Price',
      'quarterlyPrice': 'Quarterly Price',
      'quarterlyemandateprice': 'Quarterly E-Mandate Price',
      'yearlyPrice': 'Yearly Price',
      'yearlyemandateprice': 'Yearly E-Mandate Price',
      'createdAt': 'Created Date',
      'updatedAt': 'Updated Date'
    }
  });
}

export function downloadPaymentHistory(payments: any[], format: 'csv' | 'json' = 'csv') {
  downloadData(payments, {
    filename: `payment-history-${new Date().toISOString().split('T')[0]}`,
    format,
    excludeFields: ['__v'],
    customHeaders: {
      '_id': 'ID',
      'orderId': 'Order ID',
      'paymentId': 'Payment ID',
      'amount': 'Amount',
      'currency': 'Currency',
      'status': 'Status',
      'user': 'User',
      'portfolio': 'Portfolio',
      'subscription': 'Subscription',
      'paymentType': 'Payment Type',
      'isBundle': 'Is Bundle',
      'bundle': 'Bundle',
      'createdAt': 'Created Date',
      'updatedAt': 'Updated Date'
    }
  });
}

export function downloadUsersWithSubscriptions(usersWithSubs: any[], format: 'csv' | 'json' = 'csv') {
  downloadData(usersWithSubs, {
    filename: `users-subscriptions-${new Date().toISOString().split('T')[0]}`,
    format,
    excludeFields: ['password', '__v', 'userSubscriptions'],
    customHeaders: {
      '_id': 'ID',
      'username': 'Username',
      'email': 'Email',
      'fullName': 'Full Name',
      'phone': 'Phone',
      'role': 'Role',
      'emailVerified': 'Email Verified',
      'isBanned': 'Is Banned',
      'totalSubscriptions': 'Total Subscriptions',
      'activeSubscriptions': 'Active Subscriptions',
      'lastSubscriptionDate': 'Last Subscription Date',
      'profileCompleteness': 'Profile Completeness (%)',
      'createdAt': 'Created Date',
      'updatedAt': 'Updated Date'
    }
  });
}

export function downloadPortfolios(portfolios: any[], format: 'csv' | 'json' = 'csv') {
  downloadData(portfolios, {
    filename: `portfolios-${new Date().toISOString().split('T')[0]}`,
    format,
    excludeFields: ['__v'],
    customHeaders: {
      '_id': 'ID',
      'name': 'Name',
      'description': 'Description',
      'PortfolioCategory': 'Category',
      'minInvestment': 'Min Investment',
      'holdings': 'Holdings',
      'CAGRSinceInception': 'CAGR Since Inception',
      'oneYearGains': 'One Year Gains',
      'createdAt': 'Created Date',
      'updatedAt': 'Updated Date'
    }
  });
}

export function downloadCoupons(coupons: any[], format: 'csv' | 'json' = 'csv') {
  downloadData(coupons, {
    filename: `coupons-${new Date().toISOString().split('T')[0]}`,
    format,
    excludeFields: ['__v'],
    customHeaders: {
      '_id': 'ID',
      'code': 'Code',
      'title': 'Title',
      'description': 'Description',
      'discountType': 'Discount Type',
      'discountValue': 'Discount Value',
      'usageLimit': 'Usage Limit',
      'usedCount': 'Used Count',
      'validUntil': 'Valid Until',
      'status': 'Status',
      'createdAt': 'Created Date',
      'updatedAt': 'Updated Date'
    }
  });
}

export function downloadFAQs(faqs: any[], format: 'csv' | 'json' = 'csv') {
  downloadData(faqs, {
    filename: `faqs-${new Date().toISOString().split('T')[0]}`,
    format,
    excludeFields: ['__v'],
    customHeaders: {
      '_id': 'ID',
      'question': 'Question',
      'answer': 'Answer',
      'category': 'Category',
      'tags': 'Tags',
      'isPublished': 'Is Published',
      'createdAt': 'Created Date',
      'updatedAt': 'Updated Date'
    }
  });
}