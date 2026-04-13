export interface GeneralPrice {
  id: number;
  serviceId: number;
  serviceName: string;
  currency: string;
  price: number;
  createdAt: string;
}

export interface UserwisePrice {
  id: number;
  username: string;
  serviceId: number;
  serviceName: string;
  currency: string;
  price: number;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Mock Data
let generalPrices: GeneralPrice[] = [
  { id: 1, serviceId: 1, serviceName: 'Consultation', currency: 'USD', price: 100, createdAt: new Date().toISOString() },
  { id: 2, serviceId: 2, serviceName: 'Installation', currency: 'EUR', price: 250, createdAt: new Date().toISOString() },
];

let userwisePrices: UserwisePrice[] = [
  { id: 1, username: 'johndoe', serviceId: 1, serviceName: 'Consultation', currency: 'USD', price: 80, createdAt: new Date().toISOString() },
];

export const MOCK_USERS = ['johndoe', 'janedoe', 'admin', 'guest'];
export const MOCK_CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD'];

// Helper for simulating network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const pricesApi = {
  // --- General Prices ---
  getGeneralPrices: async (page: number, pageSize: number, search: string = ''): Promise<PagedResult<GeneralPrice>> => {
    await delay(400);
    let filtered = generalPrices.filter(p => 
      p.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      p.currency.toLowerCase().includes(search.toLowerCase())
    );
    
    const totalCount = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return { items, totalCount, page, pageSize, totalPages };
  },

  createGeneralPrice: async (serviceId: number, serviceName: string, currency: string, price: number): Promise<GeneralPrice> => {
    await delay(400);
    const newPrice: GeneralPrice = {
      id: generalPrices.length > 0 ? Math.max(...generalPrices.map(p => p.id)) + 1 : 1,
      serviceId,
      serviceName,
      currency,
      price,
      createdAt: new Date().toISOString()
    };
    generalPrices.push(newPrice);
    return newPrice;
  },

  updateGeneralPrice: async (id: number, serviceId: number, serviceName: string, currency: string, price: number): Promise<GeneralPrice> => {
    await delay(400);
    const index = generalPrices.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Price not found');
    
    generalPrices[index] = {
      ...generalPrices[index],
      serviceId,
      serviceName,
      currency,
      price
    };
    return generalPrices[index];
  },

  // --- Userwise Prices ---
  getUserwisePrices: async (page: number, pageSize: number, search: string = ''): Promise<PagedResult<UserwisePrice>> => {
    await delay(400);
    let filtered = userwisePrices.filter(p => 
      p.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      p.username.toLowerCase().includes(search.toLowerCase()) ||
      p.currency.toLowerCase().includes(search.toLowerCase())
    );
    
    const totalCount = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return { items, totalCount, page, pageSize, totalPages };
  },

  createUserwisePrice: async (username: string, serviceId: number, serviceName: string, currency: string, price: number): Promise<UserwisePrice> => {
    await delay(400);
    const newPrice: UserwisePrice = {
      id: userwisePrices.length > 0 ? Math.max(...userwisePrices.map(p => p.id)) + 1 : 1,
      username,
      serviceId,
      serviceName,
      currency,
      price,
      createdAt: new Date().toISOString()
    };
    userwisePrices.push(newPrice);
    return newPrice;
  },

  updateUserwisePrice: async (id: number, username: string, serviceId: number, serviceName: string, currency: string, price: number): Promise<UserwisePrice> => {
    await delay(400);
    const index = userwisePrices.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Price not found');
    
    userwisePrices[index] = {
      ...userwisePrices[index],
      username,
      serviceId,
      serviceName,
      currency,
      price
    };
    return userwisePrices[index];
  },
};
