/**
 * Avatar mapping utility for Apex Core Banking System personas and officers.
 * Provides realistic executive portraits for each banking role and user.
 */

export const BANK_PORTRAITS_MAP: Record<string, string> = {
  // Head Office Administrator - Rajeshwari Deshmukh
  'ho_admin': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=320&auto=format&fit=crop&q=80',
  'rajeshwari': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=320&auto=format&fit=crop&q=80',
  'deshmukh': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=320&auto=format&fit=crop&q=80',
  
  // Branch Manager - Bangalore - Vikramaditya Singhania
  'bm_bangalore': 'https://images.unsplash.com/photo-1556157382-97eda2f9e2bf?w=320&auto=format&fit=crop&q=80',
  'vikramaditya': 'https://images.unsplash.com/photo-1556157382-97eda2f9e2bf?w=320&auto=format&fit=crop&q=80',
  
  // Cashier Desk / Teller - Delhi - Priya Sen
  'cashier_delhi': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=320&auto=format&fit=crop&q=80',
  'priya': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=320&auto=format&fit=crop&q=80',
  'teller_ho': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=320&auto=format&fit=crop&q=80',
  
  // Banking Officer / Credit Analyst - Mumbai - Amit Patel
  'officer_mumbai': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&auto=format&fit=crop&q=80',
  'amit': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&auto=format&fit=crop&q=80',
  
  // Retail Customer - Rahul Sharma
  'cust_rahul': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=320&auto=format&fit=crop&q=80',
  'rahul': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=320&auto=format&fit=crop&q=80',
  
  // System Super Admin / Default Admin
  'admin': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&auto=format&fit=crop&q=80',
  'superadmin': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&auto=format&fit=crop&q=80',
};

export const getAvatarByRoleOrUser = (
  roleOrUsername?: string,
  fullName?: string
): string => {
  const key = (roleOrUsername || '').toLowerCase().trim();
  const nameKey = (fullName || '').toLowerCase().trim();

  // Check explicit username match
  for (const [mapKey, url] of Object.entries(BANK_PORTRAITS_MAP)) {
    if (key.includes(mapKey) || nameKey.includes(mapKey)) {
      return url;
    }
  }

  // Role fallback mappings
  if (key.includes('admin') || key.includes('head_office')) {
    return BANK_PORTRAITS_MAP['ho_admin'];
  }
  if (key.includes('branch_manager') || key.includes('manager')) {
    return BANK_PORTRAITS_MAP['bm_bangalore'];
  }
  if (key.includes('cashier') || key.includes('teller')) {
    return BANK_PORTRAITS_MAP['cashier_delhi'];
  }
  if (key.includes('customer')) {
    return BANK_PORTRAITS_MAP['cust_rahul'];
  }

  // Default corporate executive portrait
  return BANK_PORTRAITS_MAP['admin'];
};
