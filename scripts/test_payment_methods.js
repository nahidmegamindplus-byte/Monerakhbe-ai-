async function testPaymentMethods() {
  console.log('--- Testing Payment Methods APIs ---');

  // 1. Test Public API
  try {
    const res = await fetch('http://localhost:3000/api/payment-methods');
    const data = await res.json();
    console.log('Public /api/payment-methods response:', data);
    if (data.success && Array.isArray(data.paymentMethods)) {
      console.log(`✅ Public API returned ${data.paymentMethods.length} active payment methods.`);
      data.paymentMethods.forEach((m) => {
        console.log(`   - [${m.code}] ${m.name} | Number: ${m.accountNumber} (${m.accountType})`);
      });
    } else {
      console.error('❌ Public API test failed');
    }
  } catch (err) {
    console.error('Error fetching public payment methods:', err.message);
  }

  // 2. Test Admin Login & Payment Method Creation
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@monerakhbe.ai',
        password: 'Admin123456!',
      }),
    });
    const loginData = await loginRes.json();
    const cookie = loginRes.headers.get('set-cookie');
    console.log('Admin login status:', loginRes.status, 'Cookie present:', !!cookie);

    if (cookie) {
      // Fetch admin payment methods
      const adminMethodsRes = await fetch('http://localhost:3000/api/admin/payment-methods', {
        headers: { Cookie: cookie },
      });
      const adminMethodsData = await adminMethodsRes.json();
      console.log('Admin /api/admin/payment-methods count:', adminMethodsData.paymentMethods?.length);

      // Create a test Upay payment method
      const createRes = await fetch('http://localhost:3000/api/admin/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({
          code: 'upay',
          name: 'উপায় (Upay)',
          type: 'WALLET',
          accountNumber: '01700112233',
          accountType: 'Personal',
          instructions: '১. উপায় অ্যাপ থেকে সেন্ড মানি করুন।\n২. ট্রানজেকশন আইডি দিন।',
          chargePercent: 0,
          isActive: true,
          displayOrder: 4,
        }),
      });
      const createData = await createRes.json();
      console.log('Create Upay Method response:', createData);

      // Update the Upay method
      if (createData.paymentMethod?.id) {
        const updateRes = await fetch('http://localhost:3000/api/admin/payment-methods', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookie,
          },
          body: JSON.stringify({
            id: createData.paymentMethod.id,
            accountNumber: '01799887766',
            accountType: 'Merchant',
          }),
        });
        const updateData = await updateRes.json();
        console.log('Update Upay Method response:', updateData);

        // Delete the test Upay method to keep clean state
        const deleteRes = await fetch(`http://localhost:3000/api/admin/payment-methods?id=${createData.paymentMethod.id}`, {
          method: 'DELETE',
          headers: { Cookie: cookie },
        });
        const deleteData = await deleteRes.json();
        console.log('Delete Upay Method response:', deleteData);
      }
    }
  } catch (err) {
    console.error('Admin API error:', err.message);
  }
}

testPaymentMethods();
