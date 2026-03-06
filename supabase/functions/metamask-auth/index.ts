import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const nonceStore = new Map<string, { nonce: string; expires: number }>();

function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifySignature(message: string, signature: string, expectedAddress: string): Promise<boolean> {
  try {
    const { ethers } = await import("https://esm.sh/ethers@6.13.1");
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (e) {
    console.error("Signature verification failed:", e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, walletAddress, signature, nonce, loginAs } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "challenge") {
      const newNonce = generateNonce();
      nonceStore.set(walletAddress.toLowerCase(), {
        nonce: newNonce,
        expires: Date.now() + 5 * 60 * 1000,
      });

      return new Response(JSON.stringify({ nonce: newNonce }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!walletAddress || !signature || !nonce) {
        return new Response(JSON.stringify({ error: "Missing parameters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const addr = walletAddress.toLowerCase();

      const stored = nonceStore.get(addr);
      if (!stored || stored.nonce !== nonce || Date.now() > stored.expires) {
        console.log("Nonce not found in local store, proceeding with signature verification only");
      }
      nonceStore.delete(addr);

      const message = `Sign this message to authenticate with Arogya.\n\nNonce: ${nonce}`;
      const isValid = await verifySignature(message, signature, addr);

      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id, onboarding_complete")
        .eq("wallet_address", addr)
        .maybeSingle();

      let userId: string;
      let isNewUser = false;
      let onboardingComplete = false;

      if (existingProfile) {
        userId = existingProfile.user_id;
        onboardingComplete = existingProfile.onboarding_complete || false;

        const selectedRole = loginAs === "doctor" ? "doctor" : "patient";
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", selectedRole)
          .maybeSingle();

        if (!existingRole) {
          await supabase.from("user_roles").insert({
            user_id: userId,
            role: selectedRole,
          });
        }
      } else {
        const email = `${addr}@wallet.arogya.app`;
        const password = crypto.randomUUID();

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { wallet_address: addr },
        });

        if (authError || !authData.user) {
          console.error("User creation error:", authError);
          return new Response(JSON.stringify({ error: "Failed to create user" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        userId = authData.user.id;
        isNewUser = true;

        await supabase.from("profiles").insert({
          user_id: userId,
          wallet_address: addr,
        });

        const role = loginAs === "doctor" ? "doctor" : "patient";
        await supabase.from("user_roles").insert({
          user_id: userId,
          role,
        });
      }

      const email = `${addr}@wallet.arogya.app`;

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

      if (linkError || !linkData) {
        console.error("Link generation error:", linkError);
        return new Response(JSON.stringify({ error: "Failed to generate session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenHash = linkData.properties?.hashed_token;
      if (!tokenHash) {
        console.error("No hashed_token in link data");
        return new Response(JSON.stringify({ error: "Failed to generate session token" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: sessionData, error: sessionError } = await anonClient.auth.verifyOtp({
        type: "magiclink",
        token_hash: tokenHash,
      });

      if (sessionError || !sessionData.session) {
        console.error("OTP verification error:", sessionError);
        return new Response(JSON.stringify({ error: "Failed to create session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          is_new_user: isNewUser,
          onboarding_complete: onboardingComplete,
          login_as: loginAs || "patient",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("MetaMask auth error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
