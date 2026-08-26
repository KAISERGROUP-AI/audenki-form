import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("company_contacts")
    .select("company_name")
    .order("company_name", { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const companyNames = (data ?? []).map((row) => row.company_name);

  return NextResponse.json({ success: true, companies: companyNames });
}
