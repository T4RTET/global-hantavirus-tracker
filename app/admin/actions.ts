"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseService, hasSupabaseEnv } from "@/lib/supabase";
import type { CandidateStatus, Confidence, ReportStatus, SourceType } from "@/lib/types";
import { importPopularXPosts } from "@/lib/x-popular";

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

export async function importXPosts(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const params = new URLSearchParams();
  if (password) params.set("password", password);

  try {
    requirePassword(formData);
    const keyword = String(formData.get("keyword") || "hantavirus");
    const minViews = Number(formData.get("min_views") || 100000);
    const result = await importPopularXPosts(keyword, minViews);
    revalidatePath("/admin/review");
    revalidatePath("/x-news");
    params.set("x_status", `X import complete: ${result.inserted} inserted from ${result.found} popular post(s).`);
  } catch (error) {
    params.set("x_error", error instanceof Error ? error.message : "X import failed.");
  }

  redirect(`/admin?${params.toString()}`);
}

function reportStatus(status: CandidateStatus): ReportStatus | null {
  return status === "irrelevant" ? null : status;
}

async function findCountryId(countryIso2: string | null, countryName: string | null) {
  const supabase = getSupabaseService();
  if (countryIso2) {
    const { data } = await supabase.from("countries").select("*").eq("iso2", countryIso2).maybeSingle();
    if (data) return data;
  }
  if (countryName) {
    const { data } = await supabase.from("countries").select("*").ilike("name", countryName).maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function approveCandidate(formData: FormData) {
  requirePassword(formData);
  const supabase = getSupabaseService();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as CandidateStatus;
  const confidence = String(formData.get("confidence")) as Confidence;
  const confirmedCount = Number(formData.get("confirmed_count") || 0);
  const suspectedCount = Number(formData.get("suspected_count") || 0);
  const deathCount = Number(formData.get("death_count") || 0);

  const { data: candidate, error } = await supabase
    .from("extraction_candidates")
    .select("*, source_item:source_items(*)")
    .eq("id", id)
    .single();
  if (error) throw error;

  const sourceItem = candidate.source_item;
  const country = await findCountryId(String(formData.get("country_iso2") || candidate.country_iso2 || ""), String(formData.get("country_name") || candidate.country_name || ""));
  const finalStatus = reportStatus(status);
  if (!country || !finalStatus) {
    throw new Error("Candidate needs a matched country and reportable status before approval.");
  }

  const reportPayload = {
    country_id: country.id,
    location_name: String(formData.get("location_name") || candidate.location_name || "") || null,
    lat: Number(formData.get("lat") || candidate.lat || country.lat) || null,
    lng: Number(formData.get("lng") || candidate.lng || country.lng) || null,
    status: finalStatus,
    case_count: finalStatus === "confirmed" ? confirmedCount : 0,
    suspected_count: finalStatus === "suspected" ? suspectedCount : 0,
    death_count: finalStatus === "death" ? deathCount : 0,
    report_date: new Date(String(formData.get("date_reported") || candidate.date_reported || sourceItem?.published_at || Date.now())).toISOString(),
    source_name: sourceItem.source_name,
    source_url: sourceItem.source_url,
    source_type: sourceItem.source_type as SourceType,
    confidence,
    summary: String(formData.get("summary") || candidate.summary),
    raw_title: sourceItem.raw_title,
    raw_text: sourceItem.raw_text,
    event_key: String(formData.get("event_key") || candidate.event_key || "") || null
  };

  const { data: existingByEvent } = reportPayload.event_key
    ? await supabase.from("reports").select("id").eq("event_key", reportPayload.event_key).limit(1).maybeSingle()
    : { data: null };

  let reportId = existingByEvent?.id as string | undefined;
  if (reportId) {
    const { error: updateError } = await supabase.from("reports").update(reportPayload).eq("id", reportId);
    if (updateError) throw updateError;
  } else {
    const { data: inserted, error: insertError } = await supabase.from("reports").insert(reportPayload).select("id").single();
    if (insertError) throw insertError;
    reportId = inserted.id;
  }

  const { error: candidateError } = await supabase
    .from("extraction_candidates")
    .update({
      status,
      confidence,
      confirmed_count: confirmedCount,
      suspected_count: suspectedCount,
      death_count: deathCount,
      summary: reportPayload.summary,
      needs_review: false,
      should_affect_totals: true,
      report_id: reportId
    })
    .eq("id", id);
  if (candidateError) throw candidateError;

  await supabase.from("source_items").update({ processing_status: "processed", error: null }).eq("id", candidate.source_item_id);
  await supabase.rpc("recalculate_daily_country_stats");
  revalidatePath("/");
  revalidatePath("/latest");
  revalidatePath("/admin/review");
}

export async function ignoreCandidate(formData: FormData) {
  requirePassword(formData);
  const supabase = getSupabaseService();
  const id = String(formData.get("id"));
  const { data: candidate, error } = await supabase.from("extraction_candidates").select("source_item_id").eq("id", id).single();
  if (error) throw error;
  await supabase.from("extraction_candidates").update({ needs_review: false, status: "irrelevant", should_affect_totals: false }).eq("id", id);
  await supabase.from("source_items").update({ processing_status: "ignored", error: null }).eq("id", candidate.source_item_id);
  revalidatePath("/admin/review");
}

export async function markCandidateDuplicate(formData: FormData) {
  requirePassword(formData);
  const id = String(formData.get("id"));
  const { error } = await getSupabaseService()
    .from("extraction_candidates")
    .update({ needs_review: false, should_affect_totals: false, confidence_reason: "Marked duplicate by admin." })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/review");
}
