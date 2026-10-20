import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function requireAdmin(allowMfaSetup = false) {
  const supabase = await createClient();
  if (!supabase) redirect("/admin/login?reason=config");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/admin/login");
  const { data: membership } = await supabase.from("admin_users").select("user_id")
    .eq("user_id", user.id).eq("active", true).maybeSingle();
  if (!membership) redirect("/admin/login?reason=denied");

  if (!allowMfaSetup) {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.some((factor) => factor.status === "verified");
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!verified || assurance?.currentLevel !== "aal2") redirect("/admin/seguranca");
  }
  return { supabase, user };
}
