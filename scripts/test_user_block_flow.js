const http = require("http");

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function testUserBlockFlow() {
  console.log("=================================================");
  console.log("🧪 STARTING USER BLOCK / TURN OFF / ON FLOW TEST");
  console.log("=================================================");

  // 1. Admin Login
  console.log("\n1️⃣ Logging in as Admin...");
  const adminRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "admin@monerakhbe.ai", password: "Admin123456!" }
  );

  if (!adminRes.body.token) {
    console.error("❌ Admin login failed:", adminRes.body);
    process.exit(1);
  }
  const adminToken = adminRes.body.token;
  console.log("✅ Admin logged in successfully!");

  // 2. Create or verify a test normal user
  console.log("\n2️⃣ Ensuring a test user exists...");
  const testUserEmail = "test_block_user@example.com";
  const testUserPassword = "Password123!";

  // Try creating test user
  await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/register",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { name: "Test Blockable User", email: testUserEmail, password: testUserPassword }
  );

  // Login as test user
  const userLoginRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: testUserEmail, password: testUserPassword }
  );

  if (!userLoginRes.body.token) {
    console.error("❌ User initial login failed:", userLoginRes.body);
    process.exit(1);
  }
  const userToken = userLoginRes.body.token;
  const userId = userLoginRes.body.user.id;
  console.log(`✅ Test user ready (ID: ${userId}, Email: ${testUserEmail})`);

  // 3. Admin Blocks / Turns Off the user
  console.log("\n3️⃣ Admin blocks & turns off the user ID...");
  const blockRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/admin/users",
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    },
    { id: userId, isSuspended: true }
  );

  console.log("Block API Response:", blockRes.body);
  if (!blockRes.body.success || !blockRes.body.user.isSuspended) {
    console.error("❌ Blocking user failed");
    process.exit(1);
  }
  console.log("✅ User successfully blocked in DB (isSuspended: true)!");

  // 4. Test login attempt with blocked user
  console.log("\n4️⃣ Testing login attempt with blocked user...");
  const blockedLoginRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: testUserEmail, password: testUserPassword }
  );

  console.log(`Blocked Login Response Status: ${blockedLoginRes.status}`);
  console.log(`Blocked Login Response Body:`, blockedLoginRes.body);

  if (blockedLoginRes.status !== 403 || !blockedLoginRes.body.error.includes("ব্লক")) {
    console.error("❌ Expected 403 with Blocked warning message, but got:", blockedLoginRes);
    process.exit(1);
  }
  console.log("✅ Blocked login correctly rejected with status 403 and Bengali warning!");

  // 5. Test session verification with previous token
  console.log("\n5️⃣ Testing session verification (/api/auth/me) with previous token...");
  const sessionCheckRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/me",
    method: "GET",
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  console.log(`Session Check Status: ${sessionCheckRes.status}`);
  if (sessionCheckRes.status !== 401) {
    console.error("❌ Blocked user session was not rejected with 401!");
    process.exit(1);
  }
  console.log("✅ Blocked user session immediately revoked and rejected with 401 Unauthorized!");

  // 6. Test Quick Unblock using Email
  console.log("\n6️⃣ Admin Quick Unblocks the user using Email...");
  const unblockRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/admin/users",
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    },
    { identifier: testUserEmail, action: "UNBLOCK" }
  );

  console.log("Unblock API Response:", unblockRes.body);
  if (!unblockRes.body.success || unblockRes.body.user.isSuspended) {
    console.error("❌ Unblocking user failed");
    process.exit(1);
  }
  console.log("✅ User successfully unblocked (isSuspended: false)!");

  // 7. Verify user can log in again
  console.log("\n7️⃣ Verifying user can log in smoothly after unblock...");
  const unblockedLoginRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: testUserEmail, password: testUserPassword }
  );

  if (!unblockedLoginRes.body.token) {
    console.error("❌ User login after unblock failed:", unblockedLoginRes.body);
    process.exit(1);
  }
  console.log("✅ User logged in smoothly after unblock!");

  // 8. Admin cannot block their own account
  console.log("\n8️⃣ Testing admin self-block protection...");
  const selfBlockRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/admin/users",
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    },
    { identifier: "admin@monerakhbe.ai", action: "BLOCK" }
  );

  console.log("Self Block Response Status:", selfBlockRes.status, selfBlockRes.body);
  if (selfBlockRes.status !== 400) {
    console.error("❌ Admin was able to self-block!");
    process.exit(1);
  }
  console.log("✅ Self-block protection working perfectly!");

  console.log("\n=================================================");
  console.log("🎉 ALL USER BLOCK / TURN OFF / ON TESTS PASSED 100%!");
  console.log("=================================================");
}

testUserBlockFlow().catch(console.error);
