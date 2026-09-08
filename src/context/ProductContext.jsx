import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const db = getDb(currentUser?._db);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setProducts([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'products'), where('userId', '==', currentUser.uid));

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setProducts(data);
            setLoading(false);
        }, (err) => {
            console.warn('Product listener error:', err.code);
            setLoading(false);
        });

        return unsub;
    }, [currentUser, db]);

    const saveProduct = async (data) => {
        if (!currentUser) return;
        const ref = await addDoc(collection(db, 'products'), {
            ...data,
            stock: parseInt(data.stock) || 0,
            stockAlertThreshold: parseInt(data.stockAlertThreshold) || 0,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
        });
        return ref.id;
    };

    const updateProduct = async (id, data) => {
        const payload = { ...data };
        if (data.stock !== undefined) payload.stock = parseInt(data.stock) || 0;
        if (data.stockAlertThreshold !== undefined) payload.stockAlertThreshold = parseInt(data.stockAlertThreshold) || 0;
        await updateDoc(doc(db, 'products', id), { ...payload, updatedAt: new Date().toISOString() });
    };

    const deleteProduct = async (id) => {
        await deleteDoc(doc(db, 'products', id));
    };

    const decrementStock = async (id, quantity = 1) => {
        const product = products.find(p => p.id === id);
        if (!product || !product.stock) return;
        const newStock = Math.max(0, (product.stock || 0) - quantity);
        await updateDoc(doc(db, 'products', id), { stock: newStock, updatedAt: new Date().toISOString() });
    };

    return (
        <ProductContext.Provider value={{ products, loading, saveProduct, updateProduct, deleteProduct, decrementStock }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => useContext(ProductContext);
