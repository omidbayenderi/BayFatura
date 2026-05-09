import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setCustomers([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'customers'), where('userId', '==', currentUser.uid));

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setCustomers(data);
            setLoading(false);
        }, (err) => {
            console.error('Customer listener error:', err.code, err.message);
            // If permission-denied, show alert
            if (err.code === 'permission-denied') {
                alert('Müşteri verilerine erişim izni yok. Lütfen sayfayı yenileyin veya tekrar giriş yapın.');
            }
            setLoading(false);
        });

        return unsub;
    }, [currentUser]);

    const saveCustomer = async (data) => {
        if (!currentUser) {
            alert('Lütfen önce giriş yapın!');
            return;
        }
        const payload = {
            ...data,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
        };
        try {
            const ref = await addDoc(collection(db, 'customers'), payload);
            return ref.id;
        } catch (error) {
            console.error('Customer save error:', error);
            if (error.code === 'permission-denied') {
                alert('Müşteri eklenemedi: Yetki hatası. Lütfen tekrar giriş yapın.');
            } else {
                alert('Müşteri eklenirken hata: ' + error.message);
            }
            throw error;
        }
    };

    const updateCustomer = async (id, data) => {
        await updateDoc(doc(db, 'customers', id), { ...data, updatedAt: new Date().toISOString() });
    };

    const deleteCustomer = async (id) => {
        await deleteDoc(doc(db, 'customers', id));
    };

    return (
        <CustomerContext.Provider value={{ customers, loading, saveCustomer, updateCustomer, deleteCustomer }}>
            {children}
        </CustomerContext.Provider>
    );
};

export const useCustomers = () => useContext(CustomerContext);
