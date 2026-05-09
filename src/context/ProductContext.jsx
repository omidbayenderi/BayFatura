import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const { currentUser } = useAuth();
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
    }, [currentUser]);

    const saveProduct = async (data) => {
        if (!currentUser) return;
        const ref = await addDoc(collection(db, 'products'), {
            ...data,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
        });
        return ref.id;
    };

    const updateProduct = async (id, data) => {
        await updateDoc(doc(db, 'products', id), { ...data, updatedAt: new Date().toISOString() });
    };

    const deleteProduct = async (id) => {
        await deleteDoc(doc(db, 'products', id));
    };

    return (
        <ProductContext.Provider value={{ products, loading, saveProduct, updateProduct, deleteProduct }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => useContext(ProductContext);
