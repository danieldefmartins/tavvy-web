import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {onTheGoActor,onTheGoError,OnTheGoHttpError} from "../_shared/onthego-http.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "private, no-store",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduleEventRequest {
  tavvy_place_id: string;
  event_title?: string;
  event_description?: string;
  location_name: string;
  location_address?: string;
  latitude: number;
  longitude: number;
  scheduled_start: string; // ISO datetime
  scheduled_end: string;   // ISO datetime
  is_recurring?: boolean;
  recurrence_rule?: string; // e.g., "WEEKLY:MON,WED,FRI"
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:corsHeaders});

  try {
    const {user}=await onTheGoActor(req);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new OnTheGoHttpError("Service unavailable",503);
    const supabase = createClient(supabaseUrl, supabaseServiceKey,{auth:{persistSession:false,autoRefreshToken:false}});

    const body: ScheduleEventRequest = await req.json().catch(()=>{throw new OnTheGoHttpError("Invalid request body");});
    if (!body || typeof body!=="object" || Array.isArray(body)) throw new OnTheGoHttpError("Invalid request body");
    const {
      tavvy_place_id,
      event_title,
      event_description,
      location_name,
      location_address,
      latitude,
      longitude,
      scheduled_start,
      scheduled_end,
      is_recurring,
      recurrence_rule,
    } = body;

    if (typeof tavvy_place_id!=="string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tavvy_place_id) || typeof location_name!=="string" || !location_name.trim() || typeof scheduled_start!=="string" || typeof scheduled_end!=="string" || Object.entries({event_title,event_description,location_name,location_address,recurrence_rule}).some(([key,value])=>value!=null&&(typeof value!=="string"||value.length>(key==='event_description'?4000:500))) || (is_recurring!=null&&typeof is_recurring!=='boolean')) throw new OnTheGoHttpError("Enter valid schedule details");

    // Validate required fields
    if (!tavvy_place_id || !location_name || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !scheduled_start || !scheduled_end) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: tavvy_place_id, location_name, latitude, longitude, scheduled_start, scheduled_end" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user owns this place
    const { data: place, error: placeError } = await supabase
      .from("tavvy_places")
      .select("id, name, created_by, place_type")
      .eq("id", tavvy_place_id).eq("is_deleted",false)
      .single();

    if (placeError && placeError.code!=="PGRST116") throw new Error("Business lookup unavailable");
    if (!place) {
      return new Response(
        JSON.stringify({ error: "Place not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (place.created_by !== user.id) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to schedule events for this place" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (place.place_type !== "on_the_go") {
      return new Response(
        JSON.stringify({ error: "Only On The Go businesses can schedule events" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate dates
    const startDate = new Date(scheduled_start);
    const endDate = new Date(scheduled_end);
    const now = new Date();

    if (!Number.isFinite(startDate.getTime()) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || startDate <= now) {
      return new Response(
        JSON.stringify({ error: "Scheduled start must be in the future" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Number.isFinite(endDate.getTime()) || endDate <= startDate) {
      return new Response(
        JSON.stringify({ error: "End time must be after start time" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Max event duration: 24 hours
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    if (durationHours > 24) {
      return new Response(
        JSON.stringify({ error: "Event duration cannot exceed 24 hours" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the scheduled event
    const { data: event, error: createError } = await supabase
      .from("scheduled_events")
      .insert({
        tavvy_place_id,
        created_by: user.id,
        event_title: event_title || null,
        event_description: event_description || null,
        location_name,
        location_address: location_address || null,
        latitude,
        longitude,
        scheduled_start: startDate.toISOString(),
        scheduled_end: endDate.toISOString(),
        is_recurring: is_recurring || false,
        recurrence_rule: recurrence_rule || null,
        status: "scheduled",
      })
      .select()
      .single();

    if (createError) {
      console.error("Create event error:", createError);
      return new Response(
        JSON.stringify({ error: "Failed to create scheduled event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update tavvy_places with upcoming event info
    await supabase
      .from("tavvy_places")
      .update({
        has_upcoming_events: true,
        next_event_at: startDate.toISOString(),
      })
      .eq("id", tavvy_place_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Event scheduled successfully! Customers can now see your upcoming location.",
        event: {
          id: event.id,
          tavvy_place_id: event.tavvy_place_id,
          location_name: event.location_name,
          location_address: event.location_address,
          scheduled_start: event.scheduled_start,
          scheduled_end: event.scheduled_end,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Schedule event error:", error);
    return new Response(
      JSON.stringify({ error: onTheGoError(error)===500 ? "Internal server error" : (error as Error).message }),
      { status: onTheGoError(error), headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
