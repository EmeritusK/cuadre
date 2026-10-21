import { redirect } from "next/navigation";
import { getActiveContext } from "@/lib/org/active";
import { createClient } from "@/lib/supabase/server";

/** Home sends people straight to the session in progress. */
export default async function Home() {
  const { org } = await getActiveContext();
  const supabase = createClient();
  const { data } = await supabase
    .from("count_sessions")
    .select("code, status")
    .eq("org_id", org.id)
    .order("code", { ascending: false })
    .limit(20);

  const current = data?.find((s) => s.status === "counting") ?? data?.find((s) => s.status === "draft");
  redirect(current ? `/tomas/${current.code}` : "/tomas");
}
