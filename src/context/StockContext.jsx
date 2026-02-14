import React, { createContext, useContext, useState, useEffect } from 'react';

const StockContext = createContext();

export const useStock = () => useContext(StockContext);

export const StockProvider = ({ children }) => {
    // Initial Data
    const [products, setProducts] = useState(() => {
        const saved = localStorage.getItem('bay_products');
        return saved ? JSON.parse(saved) : [
            { id: 1, name: 'Motor Oil 5W-30', category: 'Fluids', price: 45.00, stock: 24, minStock: 5, sku: 'OIL-001', image: null },
            { id: 2, name: 'Brake Pads (Front)', category: 'Parts', price: 85.50, stock: 8, minStock: 2, sku: 'BRK-F-002', image: null },
            { id: 3, name: 'Air Filter', category: 'Filters', price: 15.00, stock: 12, minStock: 3, sku: 'FLT-AIR-003', image: null },
            { id: 4, name: 'Spark Plug', category: 'Parts', price: 12.00, stock: 40, minStock: 10, sku: 'SPK-004', image: null },
            { id: 5, name: 'Wiper Blades', category: 'Accessories', price: 25.00, stock: 15, minStock: 4, sku: 'WIP-005', image: null }
        ];
    });

    const [categories, setCategories] = useState(() => {
        const saved = localStorage.getItem('bay_product_categories');
        return saved ? JSON.parse(saved) : ['Fluids', 'Parts', 'Filters', 'Accessories', 'Services'];
    });

    const [sales, setSales] = useState(() => {
        const saved = localStorage.getItem('bay_sales');
        return saved ? JSON.parse(saved) : [];
    });

    // New: Global Settings State
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('bay_stock_settings');
        return saved ? JSON.parse(saved) : {
            taxRate: 19,
            currency: '€',
            storeName: 'Rechnung Auto Service',
            storeAddress: 'Musterstraße 1, 12345 Berlin',
            storePhone: '+49 123 456 789',
            defaultLowStock: 5
        };
    });

    const [cart, setCart] = useState([]);

    // Persistence with Error Handling
    useEffect(() => {
        try {
            localStorage.setItem('bay_products', JSON.stringify(products));
        } catch (e) {
            console.error('Failed to save products to localStorage:', e);
        }
    }, [products]);

    useEffect(() => {
        try {
            localStorage.setItem('bay_product_categories', JSON.stringify(categories));
        } catch (e) {
            console.error('Failed to save categories to localStorage:', e);
        }
    }, [categories]);

    useEffect(() => {
        try {
            localStorage.setItem('bay_sales', JSON.stringify(sales));
        } catch (e) {
            console.error('Failed to save sales to localStorage:', e);
            if (e.name === 'QuotaExceededError') {
                alert('Storage full! Unable to save new sales. Please clear some data.');
            }
        }
    }, [sales]);

    useEffect(() => {
        try {
            localStorage.setItem('bay_stock_settings', JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings to localStorage:', e);
        }
    }, [settings]);

    // --- Actions ---

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    // --- Actions ---

    // Product Management
    const addProduct = (product) => {
        const newProduct = {
            id: Date.now(),
            ...product
        };
        setProducts(prev => [...prev, newProduct]);
        return newProduct;
    };

    const updateProduct = (id, updates) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deleteProduct = (id) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    const updateStock = (id, quantityChange) => {
        setProducts(prev => prev.map(p =>
            p.id === id ? { ...p, stock: p.stock + quantityChange } : p
        ));
    };

    // Category Management
    const addCategory = (category) => {
        if (!categories.includes(category)) {
            setCategories(prev => [...prev, category]);
        }
    };

    const updateCategory = (oldCategory, newCategory) => {
        setCategories(prev => prev.map(cat => cat === oldCategory ? newCategory : cat));
        // Also update products that use this category
        setProducts(prev => prev.map(p => p.category === oldCategory ? { ...p, category: newCategory } : p));
    };

    const deleteCategory = (category) => {
        setCategories(prev => prev.filter(cat => cat !== category));
        // Optionally handle products with this category (e.g., set to 'Uncategorized')
        setProducts(prev => prev.map(p => p.category === category ? { ...p, category: 'Uncategorized' } : p));
    };

    // POS / Cart Management
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateCartQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => setCart([]);

    const completeSale = (paymentMethod = 'cash', customerName = 'Walk-in Customer') => {
        if (cart.length === 0) return null;

        const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        const newSale = {
            id: Date.now(),
            date: new Date().toISOString(),
            items: [...cart],
            total: totalAmount,
            paymentMethod,
            customerName
        };

        // 1. Record Sale
        setSales(prev => [newSale, ...prev]);

        // 2. Deduct Stock
        cart.forEach(item => {
            updateStock(item.product.id, -item.quantity);
        });

        // 3. Clear Cart
        clearCart();

        return newSale;
    };

    // Update Sale Status & Tracking
    const updateSaleStatus = (saleId, status, trackingData = {}) => {
        setSales(prevSales => prevSales.map(sale => {
            if (sale.id === saleId) {
                return {
                    ...sale,
                    status: status, // 'pending', 'shipped', 'delivered', 'returned'
                    ...trackingData, // { trackingCompany, trackingCode, trackingUrl }
                    lastUpdated: new Date().toISOString()
                };
            }
            return sale;
        }));
    };

    const clearSales = () => {
        setSales([]);
        try {
            localStorage.removeItem('bay_sales');
        } catch (e) {
            console.error('Failed to clear sales:', e);
        }
    };

    const factoryReset = () => {
        if (window.confirm('All data will be lost. Continue?')) {
            try {
                localStorage.removeItem('bay_products');
                localStorage.removeItem('bay_product_categories');
                localStorage.removeItem('bay_sales');
                localStorage.removeItem('bay_stock_settings');
                window.location.reload();
            } catch (e) {
                console.error('Reset failed:', e);
            }
        }
    };

    return (
        <StockContext.Provider value={{
            products,
            categories,
            sales,
            cart,
            addProduct,
            updateProduct,
            deleteProduct,
            addCategory,
            updateCategory,
            deleteCategory,
            addToCart,
            removeFromCart,
            updateCartQuantity,
            clearCart,
            completeSale,
            updateSaleStatus, // Export new function
            clearSales,
            factoryReset,
            settings,
            updateSettings
        }}>
            {children}
        </StockContext.Provider>
    );
};
