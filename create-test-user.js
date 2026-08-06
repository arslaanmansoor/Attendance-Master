const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUser() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: "demo@crestinfosystems.net",
      password: "demo1234",
      email_confirm: true,
      user_metadata: {
        full_name: "Demo User",
      },
    });

    if (error) {
      console.error("Error creating user:", error);
    } else {
      console.log("Test user created successfully:", data.user);
      console.log("\nYou can now sign in with:");
      console.log("Email: demo@crestinfosystems.net");
      console.log("Password: demo1234");
    }
  } catch (err) {
    console.error("Exception:", err.message);
  }
}

createTestUser();
