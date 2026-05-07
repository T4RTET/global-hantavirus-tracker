"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseService, hasSupabaseEnv } from "@/lib/supabase";
import type { Confidence, ReportStatus, SourceType } from "@/lib/types";

function requirePassword(formData: FormData) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured || formData.get("password") !== configured) {
    throw new Error("Invalid admin password.");
  }
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase env vars are required for admin mutations.");
  }
}

export async function addReport(formData: FormData) {
  requirePassword(formData);
  const supabase = getSupabaseService();
  const sourceUrl = String(formData.get("source_url") ?? "");
  const rawTitle = String(formData.get("raw_title") ?? "");

  const payload = {
    country_id: String(formData.get("country_id")),
    location_name: String(formData.get("location_name") || "") || null,
    lat: Number(formData.get("lat") || 0) || null,
    lng: Number(formData.get("lng") || 0) || null,
    status: String(formData.get("status")) as ReportStatus,
    case_count: Number(formData.get("case_count") || 0),
    death_count: Number(formData.get("death_count") || 0),
    suspected_count: Number(formData.get("suspected_count") || 0),
    report_date: new Date(String(formData.get("report_date"))).toISOString(),
    source_name: String(formData.get("source_name")),
    source_url: sourceUrl,
    source_type: String(formData.get("source_type")) as SourceType,
    confidence: String(formData.get("confidence")) as Confidence,
    summary: String(formData.get("summary")),
    raw_title: rawTitle || null,
    raw_text: String(formData.get("raw_text") || "") || null
  };

  const { error } = await supabase.from("reports").insert(payload);
  if (error) throw error;
  await supabase.rpc("recalculate_daily_country_stats");
  revalidatePath("/");
  revalidatePath("/latest");
}

export async function updateReportConfidence(formData: FormData) {
  requirePassword(formData);
  const { error } = await getSupabaseService()
    .from("reports")
    .update({ confidence: String(formData.get("confidence")) as Confidence })
    .eq("id", String(formData.get("id")));
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/latest");
}

export async function deleteReport(formData: FormData) {
  requirePassword(formData);
  const supabase = getSupabaseService();
  const { error } = await supabase.from("reports").delete().eq("id", String(formData.get("id")));
  if (error) throw error;
  await supabase.rpc("recalculate_daily_country_stats");
  revalidatePath("/");
  revalidatePath("/latest");
}

export async function recalculateStats(formData: FormData) {
  requirePassword(formData);
  const { error } = await getSupabaseService().rpc("recalculate_daily_country_stats");
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/latest");
}
