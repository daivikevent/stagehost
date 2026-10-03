/* ============================================
   BookMyArtist — Indian GST Tax Invoice Types
   Compliance with GST Act (Rule 46 - Tax Invoice)
   ============================================ */

export interface IndianState {
  code: string;
  name: string;
}

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
];

export interface ArtistBillingDetails {
  businessName: string;
  gstin?: string;
  pan?: string;
  billingAddress: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
}

export interface PlatformCompanyDetails {
  legalName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  email: string;
  website: string;
  invoicePrefix: string;
  sacCode: string;
}

export const DEFAULT_PLATFORM_COMPANY: PlatformCompanyDetails = {
  legalName: 'BookMyArtist Technologies Private Limited',
  tradeName: 'BookMyArtist',
  gstin: '27AAGCB9876F1Z4',
  pan: 'AAGCB9876F',
  address: 'B-402, Signature One, Bandra Kurla Complex, Bandra East',
  city: 'Mumbai',
  state: 'Maharashtra',
  stateCode: '27',
  pincode: '400051',
  email: 'billing@bookmyartist.in',
  website: 'https://bookmyartist.in',
  invoicePrefix: 'BMA/2026-27/',
  sacCode: '998315', // Hosting and IT infrastructure provisioning services
};

export interface InvoiceLineItem {
  id: string;
  description: string;
  sacCode: string;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
}

export interface TaxInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  billingPeriod: string;
  placeOfSupply: string;
  isB2B: boolean;
  supplier: PlatformCompanyDetails;
  customer: {
    name: string;
    businessName: string;
    email: string;
    phone: string;
    gstin?: string;
    pan?: string;
    address: string;
    city: string;
    state: string;
    stateCode: string;
    pincode: string;
  };
  items: InvoiceLineItem[];
  subtotalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  totalAmount: number;
  amountInWords: string;
  paymentDetails: {
    paymentId: string;
    orderId?: string;
    mode: string;
    date: string;
    status: 'PAID' | 'COMPLETED' | 'REFUNDED';
  };
}
