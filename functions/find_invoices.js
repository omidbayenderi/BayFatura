import admin from 'firebase-admin';

try {
    admin.initializeApp();
    const db = admin.firestore();
    
    console.log("Searching for invoices...");
    db.collection('invoices').get()
        .then(snapshot => {
            console.log(`Found ${snapshot.size} total invoices.`);
            const tenants = new Set();
            snapshot.forEach(doc => {
                const data = doc.data();
                tenants.add(data.tenantId);
                console.log(`Invoice ID: ${doc.id}, Tenant: ${data.tenantId}, Client: ${data.recipientName || 'unknown'}, Number: ${data.invoiceNumber || 'none'}`);
            });
            console.log("Unique tenants in invoices:", Array.from(tenants));
            
            console.log("\nSearching for users...");
            db.collection('users').get().then(userSnap => {
                console.log(`Found ${userSnap.size} total users.`);
                userSnap.forEach(uDoc => {
                    console.log(`User ID (UID): ${uDoc.id}, Email: ${uDoc.data().email}, Name: ${uDoc.data().name}, TenantId: ${uDoc.data().tenantId}`);
                });
            });
        })
        .catch(err => {
            console.error("Error fetching invoices:", err);
        });
} catch (e) {
    console.error("Initialization failed:", e);
}
